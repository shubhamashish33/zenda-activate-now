package com.zenda.assessment.shared;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfiguration implements WebMvcConfigurer {
    private final String origin;
    public WebConfiguration(@Value("${app.cors-origin}") String origin) { this.origin = origin; }
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origin).allowedMethods("GET", "PUT")
            .allowedHeaders("Content-Type").maxAge(3600);
    }
}
