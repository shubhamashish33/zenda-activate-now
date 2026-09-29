package com.zenda.assessment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.mysql.MySQLContainer;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
class ActivationApiTest {
    @Container static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4.8");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    private final JsonMapper mapper = JsonMapper.builder().build();
    private final Map<String, String> valid = Map.of("phone", "+919876543210", "pan", "ABCDE1234F",
        "nameAsOnPan", "DEMO PARENT", "email", "parent@example.com");

    @BeforeEach void reset() { jdbc.update("DELETE FROM activations"); }

    @Test void dashboardComesFromDatabase() throws Exception {
        mvc.perform(get("/api/v1/students")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(1));
        mvc.perform(get("/api/v1/students/1/dashboard"))
            .andExpect(jsonPath("$.student.name").value("Jessica John Jones"))
            .andExpect(jsonPath("$.fee.annualFee").value(340000)).andExpect(jsonPath("$.activated").value(false));
        jdbc.update("UPDATE schools SET name = 'Database school' WHERE id = 1");
        try {
            mvc.perform(get("/api/v1/students/1/dashboard")).andExpect(jsonPath("$.school.name").value("Database school"));
        } finally { jdbc.update("UPDATE schools SET name = 'School name' WHERE id = 1"); }
    }

    @Test void activationIsPersistentAndIdenticalRetryIsIdempotent() throws Exception {
        String first = submit(valid).andExpect(status().isOk()).andExpect(jsonPath("$.activated").value(true))
            .andReturn().getResponse().getContentAsString();
        String second = submit(valid).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(mapper.readTree(second).get("submittedAt")).isEqualTo(mapper.readTree(first).get("submittedAt"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM activations", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT phone FROM activations WHERE student_id = 1", String.class)).isEqualTo(valid.get("phone"));
        mvc.perform(get("/api/v1/students/1/dashboard")).andExpect(jsonPath("$.activated").value(true));
    }

    @Test void changedRequestUpdatesSingleActivation() throws Exception {
        submit(valid).andExpect(status().isOk());
        var updated = new java.util.HashMap<>(valid); updated.put("email", "changed@example.com");
        submit(updated).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM activations", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT email FROM activations WHERE student_id=1", String.class)).isEqualTo("changed@example.com");
    }

    @ParameterizedTest
    @CsvSource({"phone,9876543210", "phone,+91987654321", "phone,+9198765432101", "phone,+91abcdefghij",
        "email,parent@example.org", "email,parentexample.com", "email,parent@.com", "email,a..b@example.com",
        "email,parent@-example.com", "pan,AB123", "nameAsOnPan,'   '"})
    void rejectsInvalidFieldsWithoutWriting(String field, String value) throws Exception {
        var invalid = new java.util.HashMap<>(valid); invalid.put(field, value);
        submit(invalid).andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.errors." + field).exists());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM activations", Integer.class)).isZero();
    }

    @Test void normalizesBeforeValidating() throws Exception {
        var input = new java.util.HashMap<>(valid);
        input.put("pan", " abcde1234f "); input.put("nameAsOnPan", " DEMO PARENT ");
        input.put("email", " parent@example.COM ");
        submit(input).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT pan FROM activations WHERE student_id=1", String.class)).isEqualTo("ABCDE1234F");
        assertThat(jdbc.queryForObject("SELECT name_as_on_pan FROM activations WHERE student_id=1", String.class)).isEqualTo("DEMO PARENT");
    }

    @Test void malformedAndMissingFieldsReturnSafeErrors() throws Exception {
        mvc.perform(put("/api/v1/students/1/activation").contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Provide a valid JSON request body."));
        submit(Map.of()).andExpect(status().isBadRequest());
    }

    @Test void unknownStudentReturns404() throws Exception {
        mvc.perform(get("/api/v1/students/999/dashboard")).andExpect(status().isNotFound());
        mvc.perform(put("/api/v1/students/999/activation").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(valid))).andExpect(status().isNotFound());
    }

    @Test void allowsOnlyConfiguredCorsOrigin() throws Exception {
        mvc.perform(options("/api/v1/students/1/activation").header("Origin", "http://localhost:4200")
            .header("Access-Control-Request-Method", "PUT"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
        mvc.perform(options("/api/v1/students/1/activation").header("Origin", "https://untrusted.example")
            .header("Access-Control-Request-Method", "PUT")).andExpect(status().isForbidden());
    }

    @Test void concurrentFirstSubmissionsCreateOneRow() throws Exception {
        try (var executor = Executors.newFixedThreadPool(2)) {
            CountDownLatch ready = new CountDownLatch(2);
            CountDownLatch start = new CountDownLatch(1);
            Callable<Integer> request = () -> {
                ready.countDown(); start.await(10, TimeUnit.SECONDS);
                return submit(valid).andReturn().getResponse().getStatus();
            };
            var one = executor.submit(request); var two = executor.submit(request);
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue(); start.countDown();
            assertThat(List.of(one.get(20, TimeUnit.SECONDS), two.get(20, TimeUnit.SECONDS))).containsOnly(200);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM activations", Integer.class)).isEqualTo(1);
        }
    }

    private org.springframework.test.web.servlet.ResultActions submit(Map<String, String> body) throws Exception {
        return mvc.perform(put("/api/v1/students/1/activation").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(body)));
    }
}
