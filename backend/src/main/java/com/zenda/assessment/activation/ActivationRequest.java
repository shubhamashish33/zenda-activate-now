package com.zenda.assessment.activation;

import java.util.Locale;
import jakarta.validation.constraints.*;

public record ActivationRequest(
    @NotBlank @Pattern(regexp = "^\\+91[0-9]{10}$", message = "Enter +91 followed by exactly 10 digits") String phone,
    @NotBlank @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Enter a valid PAN, for example ABCDE1234F") String pan,
    @NotBlank(message = "Enter the name as on PAN") @Size(max = 150) String nameAsOnPan,
    @NotBlank @Size(max = 254)
    @Pattern(regexp = "^[A-Za-z0-9_%+-]+(?:\\.[A-Za-z0-9_%+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+[Cc][Oo][Mm]$",
             message = "Enter a valid email ending in .com") String email
) {
    public ActivationRequest {
        phone = trim(phone);
        pan = pan == null ? null : pan.trim().toUpperCase(Locale.ROOT);
        nameAsOnPan = trim(nameAsOnPan);
        email = trim(email);
    }
    private static String trim(String value) { return value == null ? null : value.trim(); }
}
