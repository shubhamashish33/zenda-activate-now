package com.zenda.assessment.activation;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/students/{id}/activation")
public class ActivationController {
    private final ActivationService service;
    public ActivationController(ActivationService service) { this.service = service; }
    @PutMapping public ActivationService.ActivationResponse activate(@PathVariable Long id, @Valid @RequestBody ActivationRequest request) {
        return service.activate(id, request);
    }
}
