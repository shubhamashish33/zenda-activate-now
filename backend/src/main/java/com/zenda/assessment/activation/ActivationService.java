package com.zenda.assessment.activation;

import com.zenda.assessment.dashboard.StudentRepository;
import com.zenda.assessment.shared.ResourceNotFoundException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivationService {
    private final StudentRepository students;
    private final ActivationRepository activations;
    public ActivationService(StudentRepository students, ActivationRepository activations) {
        this.students = students; this.activations = activations;
    }
    public record ActivationResponse(Long studentId, boolean activated, LocalDateTime submittedAt) {}
    @Transactional
    public ActivationResponse activate(Long id, ActivationRequest request) {
        // Serialize requests per student, including the first insertion where no activation row exists yet.
        students.findForActivation(id).orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        Activation activation = activations.findById(id).orElseGet(() -> new Activation(id));
        if (!activation.matches(request)) {
            activation.update(request, LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS));
            activations.save(activation);
        }
        return new ActivationResponse(id, true, activation.getSubmittedAt());
    }
}
