package com.zenda.assessment.activation;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "activations")
public class Activation {
    @Id private Long studentId;
    private String phone;
    private String pan;
    private String nameAsOnPan;
    private String email;
    private LocalDateTime submittedAt;
    protected Activation() {}
    public Activation(Long studentId) { this.studentId = studentId; }
    public void update(ActivationRequest request, LocalDateTime time) {
        phone = request.phone(); pan = request.pan(); nameAsOnPan = request.nameAsOnPan();
        email = request.email(); submittedAt = time;
    }
    public boolean matches(ActivationRequest request) {
        return request.phone().equals(phone) && request.pan().equals(pan)
            && request.nameAsOnPan().equals(nameAsOnPan) && request.email().equals(email);
    }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
}
