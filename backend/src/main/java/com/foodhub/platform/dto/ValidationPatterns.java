package com.foodhub.platform.dto;

public final class ValidationPatterns {

    public static final String STRONG_PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";
    public static final String STRONG_PASSWORD_MESSAGE =
            "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";

    private ValidationPatterns() {
    }
}
