package com.zenda.assessment.dashboard;

import java.math.BigDecimal;

public record DashboardResponse(SchoolView school, StudentView student, FeeView fee, boolean activated) {
    public record SchoolView(Long id, String name, String logoUrl) {}
    public record StudentView(Long id, String name, String className, String avatarUrl) {}
    public record FeeView(BigDecimal annualFee, String currency, BigDecimal interestRate) {}
}
