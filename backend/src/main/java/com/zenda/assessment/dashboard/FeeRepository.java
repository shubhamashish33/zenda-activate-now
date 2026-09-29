package com.zenda.assessment.dashboard;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeRepository extends JpaRepository<FeeSummary, Long> {}
