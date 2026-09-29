package com.zenda.assessment.dashboard;

import java.math.BigDecimal;
import jakarta.persistence.*;

@Entity
@Table(name = "fee_summaries")
public class FeeSummary {
    @Id private Long studentId;
    @Column(precision = 12, scale = 2) private BigDecimal annualFee;
    @Column(columnDefinition = "char(3)") private String currency;
    @Column(precision = 5, scale = 2) private BigDecimal interestRate;
    protected FeeSummary() {}
    public BigDecimal getAnnualFee() { return annualFee; }
    public String getCurrency() { return currency; }
    public BigDecimal getInterestRate() { return interestRate; }
}
