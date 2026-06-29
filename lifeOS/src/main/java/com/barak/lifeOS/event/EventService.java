package com.barak.lifeOS.event;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.barak.lifeOS.common.Helper;
import com.barak.lifeOS.event.EventDto.OccurrenceResponse;
import com.barak.lifeOS.exception.ForbiddenException;
import com.barak.lifeOS.exception.ResourceNotFoundException;
import com.barak.lifeOS.user.User;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import net.fortuna.ical4j.model.Recur;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final EventReminderRepository reminderRepository;
    private final RecurrenceExpander recurrenceExpander;
    private final Helper helper;

    public List<EventDto.Response> getAll(){
        User user = helper.getCurrentUser();
        return eventRepository.findByUserAndStatus(user, Status.ACTIVE).stream()
            .map(EventDto.Response::fromEntity)
            .toList();
    }

    public EventDto.Response getById(UUID id){
        Event event = getEventById(id);
        return EventDto.Response.fromEntity(event);
    }

    public List<OccurrenceResponse> getByDateRange(LocalDate from, LocalDate to) {
        User user = helper.getCurrentUser();
        ZoneId userZone = ZoneId.of(user.getTimezone());

        if (from.isAfter(to)) {
            throw new IllegalArgumentException("From date must be before to date");
        }

        Instant rangeStart = from.atStartOfDay(userZone).toInstant();
        Instant rangeEnd   = to.atTime(23, 59, 59).atZone(userZone).toInstant();

        List<Event> candidates = eventRepository.findCandidateEvents(
            user, rangeEnd, rangeStart
        );

        // Expand each event — non-recurring events return 0 or 1 occurrence,
        // recurring events return N occurrences within the range
        return candidates.stream()
            .flatMap(event -> recurrenceExpander
                .expand(event, from, to, userZone).stream())
            .sorted(Comparator.comparing(OccurrenceResponse::startDateTime))
            .toList();
    }

    public List<EventReminderDto.Response> getRemindersByEvent(UUID eventId){
        Event event = getEventById(eventId);
        return reminderRepository.findByEvent(event).stream()
            .map(EventReminderDto.Response::fromEntity)
            .toList();
    }

    @Transactional
    public EventDto.Response createEvent(EventDto.CreateRequest request){

        if (request.recurrenceRule() != null) {
            validateRecurrenceRule(request.recurrenceRule());
        }
        Event event = new Event();
        event.setUser(helper.getCurrentUser());
        event.setTitle(request.title());
        event.setDescription(request.description());

        if(request.allDay()){
            event.setStartDateTime(request.startDate().atStartOfDay().toInstant(ZoneOffset.UTC));
            event.setEndDateTime(request.endDate().atStartOfDay().toInstant(ZoneOffset.UTC));
        } else{
            event.setStartDateTime(request.startDateTime());
            event.setEndDateTime(request.endDateTime());
        }
        event.setLocation(request.location());
        event.setRecurrenceRule(request.recurrenceRule());
        event.setColor(request.color() != null ? request.color() : "#CB410B");
        event.setStatus(Status.ACTIVE);
        event.setEventStatus(resolveDisplayStatus(event));
        Event saved = eventRepository.save(event);

        List<EventReminder> reminders = request.reminderMinutes() != null ? 
            request.reminderMinutes().stream()
                .map(minutes -> EventReminder.builder()
                        .event(saved)
                        .remindBeforeMinutes(minutes)
                        .notified(false)
                        .build())
                .toList()
            : List.of();
        
        if(!reminders.isEmpty()){
            reminderRepository.saveAll(reminders);
        }

        return EventDto.Response.fromEntity(saved);
    }

    @Transactional
    public EventDto.Response updateEvent(UUID id, EventDto.UpdateRequest request){
        Event event = getEventById(id);

        if(request.title() != null) event.setTitle(request.title());
        if(request.description() != null) event.setDescription(request.description());
        if(request.startDateTime() != null) event.setStartDateTime(request.startDateTime());
        if(request.endDateTime() != null) event.setEndDateTime(request.endDateTime());
       
        if (request.startDateTime() != null || request.endDateTime() != null) {
            Instant newStart = request.startDateTime() != null
                ? request.startDateTime()
                : event.getStartDateTime();
            Instant newEnd = request.endDateTime() != null
                ? request.endDateTime()
                : event.getEndDateTime();

            if (newStart.isAfter(newEnd)) {
                throw new IllegalArgumentException("Start time must be before end time");
            }
            event.setStartDateTime(newStart);
            event.setEndDateTime(newEnd);
        }

        if (request.allDay() != null) {
            event.setAllDay(request.allDay());

            if (request.allDay()) {
                // Converting TO all-day — need date boundaries, time is irrelevant
                // Use startDate/endDate from request if provided,
                LocalDate startDate = request.startDate() != null
                    ? request.startDate()
                    : event.getStartDateTime()
                        .atZone(ZoneId.of(helper.getCurrentUser().getTimezone()))
                        .toLocalDate();

                LocalDate endDate = request.endDate() != null
                    ? request.endDate()
                    : event.getEndDateTime()
                        .atZone(ZoneId.of(helper.getCurrentUser().getTimezone()))
                        .toLocalDate();

                if (startDate.isAfter(endDate)) {
                    throw new IllegalArgumentException(
                        "Start date must be before or equal to end date");
                }

                event.setStartDateTime(startDate.atStartOfDay().toInstant(ZoneOffset.UTC));
                event.setEndDateTime(endDate.atStartOfDay().toInstant(ZoneOffset.UTC));

            } else {
                // Converting FROM all-day back to timed event
                // startDateTime and endDateTime must be explicitly provided
                if (request.startDateTime() == null || request.endDateTime() == null) {
                    throw new IllegalArgumentException(
                        "StartDateTime and EndDateTime are required when converting " +
                        "from an all-day event to a timed event");
                }
                if (request.startDateTime().isAfter(request.endDateTime())) {
                    throw new IllegalArgumentException("Start time must be before end time");
                }
                event.setStartDateTime(request.startDateTime());
                event.setEndDateTime(request.endDateTime());
            }
        }

        if(request.location() != null) event.setLocation(request.location());
        if(request.color() != null) event.setColor(request.color());
        if(request.recurrenceRule() != null){
            validateRecurrenceRule(request.recurrenceRule());
            event.setRecurrenceRule(request.recurrenceRule());
        }else if (request.removeRecurrence() != null && request.removeRecurrence()) {
            // User is converting recurring → one-time
            // Strip the rule entirely — event becomes a single occurrence
            event.setRecurrenceRule(null);
        }

        if (request.reminderMinutes() != null) {
        // Replace all existing reminders
            reminderRepository.deleteByEvent(event);
            if (!request.reminderMinutes().isEmpty()) {
                List<EventReminder> reminders = request.reminderMinutes().stream()
                    .map(minutes -> EventReminder.builder()
                        .event(event)
                        .remindBeforeMinutes(minutes)
                        .notified(false)
                        .build())
                    .toList();
                reminderRepository.saveAll(reminders);
            }
        }

        eventRepository.save(event);
        return EventDto.Response.fromEntity(event);
    }

    public EventDto.Response cancelEvent(UUID eventId){
        Event event = getEventById(eventId);
        event.setStatus(Status.CANCELLED);
        resolveDisplayStatus(event);
        event.setDeletedAt(Instant.now());
        eventRepository.save(event);

        return EventDto.Response.fromEntity(event);
    }

    @Transactional
    public EventReminderDto.Response addReminder(UUID eventId, int minutes){
        User user = helper.getCurrentUser();
        Event event = eventRepository.findByIdAndUser(eventId, user).orElseThrow(
            () -> new ResourceNotFoundException("Event not found with id: " + eventId)
        );

        boolean alreadyExists = reminderRepository.existsByEventAndRemindBeforeMinutes(event, minutes);

        if(alreadyExists){
            throw new IllegalArgumentException("A reminder for " + minutes + " minutes already exists for this event");
        }
        EventReminder reminder = EventReminder.builder()
            .event(getEventById(eventId))
            .remindBeforeMinutes(minutes)
            .notified(false)
            .build();
        
        reminderRepository.save(reminder);
        return EventReminderDto.Response.fromEntity(reminder);
    }

    public EventReminderDto.Response removeReminder(UUID id){
        EventReminder reminder = reminderRepository.findById(id).orElseThrow(
            () -> new ResourceNotFoundException("Event Reminder not found")
        );

        getEventById(reminder.getEvent().getId());
        reminderRepository.delete(reminder);

        return EventReminderDto.Response.fromEntity(reminder);
    }

    private void validateRecurrenceRule(String rule) {
        try {
            new Recur<>(rule);  // ical4j will throw if the string is malformed
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid recurrence rule: " + rule);
        }
    }

    private Event getEventById(UUID id){
        Event event = eventRepository.findById(id).orElseThrow(
            () -> new ResourceNotFoundException("Event not found")
        );

        if(!event.getUser().getId().equals(helper.getCurrentUser().getId())){
            throw new ForbiddenException("Access denied");
        }

        return event;
    }

    private EventStatus resolveDisplayStatus(Event event){
        if(event.getStatus() == Status.CANCELLED){
            return EventStatus.CANCELLED;
        }

        Instant now = Instant.now();
        if(now.isBefore(event.getStartDateTime())) return EventStatus.UPCOMING;
        if(now.isAfter(event.getEndDateTime())) return EventStatus.PASSED;
        return EventStatus.ONGOING;
    }
}
