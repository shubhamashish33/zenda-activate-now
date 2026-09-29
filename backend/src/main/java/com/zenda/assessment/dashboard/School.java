package com.zenda.assessment.dashboard;

import jakarta.persistence.*;

@Entity
@Table(name = "schools")
public class School {
    @Id private Long id;
    private String name;
    private String logoUrl;
    protected School() {}
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getLogoUrl() { return logoUrl; }
}
