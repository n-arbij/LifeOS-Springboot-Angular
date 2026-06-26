package com.barak.lifeOS.common.encryption;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

public class AesGcmUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private AesGcmUtil() {}

    public static String encrypt(String plainText, String base64MasterKey) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, toKey(base64MasterKey), new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] cipherText = cipher.doFinal(plainText.getBytes());

            // Store as: Base64(iv + cipherText)
            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public static String decrypt(String encryptedBase64, String base64MasterKey) {
        try {
            byte[] combined = Base64.getDecoder().decode(encryptedBase64);

            // Split iv and cipherText
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] cipherText = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, toKey(base64MasterKey), new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(cipherText));
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    private static SecretKey toKey(String base64MasterKey) {
        byte[] keyBytes = Base64.getDecoder().decode(base64MasterKey);
        return new SecretKeySpec(keyBytes, "AES");
    }
}