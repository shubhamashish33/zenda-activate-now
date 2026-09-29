package com.zenda.assessment.dashboard;

import com.zenda.assessment.activation.ActivationRepository;
import com.zenda.assessment.shared.ResourceNotFoundException;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private final StudentRepository students;
    private final FeeRepository fees;
    private final ActivationRepository activations;
    public DashboardService(StudentRepository students, FeeRepository fees, ActivationRepository activations) {
        this.students = students; this.fees = fees; this.activations = activations;
    }
    public record StudentOption(Long id, String name) {}
    public List<StudentOption> students() {
        return students.findAll(Sort.by("id")).stream().map(s -> new StudentOption(s.getId(), s.getName())).toList();
    }
    public DashboardResponse dashboard(Long id) {
        Student student = students.findById(id).orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        FeeSummary fee = fees.findById(id).orElseThrow(() -> new ResourceNotFoundException("Fee summary not found"));
        School school = student.getSchool();
        return new DashboardResponse(
            new DashboardResponse.SchoolView(school.getId(), school.getName(), school.getLogoUrl()),
            new DashboardResponse.StudentView(student.getId(), student.getName(), student.getClassName(), student.getAvatarUrl()),
            new DashboardResponse.FeeView(fee.getAnnualFee(), fee.getCurrency(), fee.getInterestRate()),
            activations.existsById(id));
    }
}
