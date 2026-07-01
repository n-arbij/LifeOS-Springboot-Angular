import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class StorageService {

    set(key: string, value: unknown): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    get<T> (key: string): T | null {
        const value = localStorage.getItem(key);
        if(!value || value === 'undefined') {
            return null;
        }
        try{
            return JSON.parse(value);
        }catch (e) {
            console.error('Invalid JSON in storage for key: ', key, e);
            return null;
        }
    }

    remove(key: string) : void {
        localStorage.removeItem(key);
    }

    clear(): void{
        localStorage.clear();
    }
}