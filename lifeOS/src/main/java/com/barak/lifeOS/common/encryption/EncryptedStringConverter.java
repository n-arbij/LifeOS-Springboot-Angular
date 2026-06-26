package com.barak.lifeOS.common.encryption;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.persistence.Converter;
import jakarta.persistence.AttributeConverter;

@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String>{

    @Value("${app.encryption.key}")
    private String masterKey;

    @Override
    public String convertToDatabaseColumn(String plainText) {
        if(plainText == null) return null;
        return AesGcmUtil.encrypt(plainText, masterKey);
    }

    @Override
    public String convertToEntityAttribute(String cipherText){
        if (cipherText == null) return null;
        return AesGcmUtil.decrypt(cipherText, masterKey);
    }
}
