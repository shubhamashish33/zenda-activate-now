package com.zenda.assessment.dashboard;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/students")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }
    @GetMapping public List<DashboardService.StudentOption> students() { return service.students(); }
    @GetMapping("/{id}/dashboard") public DashboardResponse dashboard(@PathVariable Long id) {
        return service.dashboard(id);
    }
}
