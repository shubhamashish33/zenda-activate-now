package com.zenda.assessment.dashboard;

import jakarta.persistence.*;

@Entity
@Table(name = "students")
public class Student {
    @Id private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "school_id") private School school;
    private String name;
    private String className;
    private String avatarUrl;
    protected Student() {}
    public Long getId() { return id; }
    public School getSchool() { return school; }
    public String getName() { return name; }
    public String getClassName() { return className; }
    public String getAvatarUrl() { return avatarUrl; }
}
