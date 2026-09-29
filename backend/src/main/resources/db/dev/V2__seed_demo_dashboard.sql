-- Synthetic demonstration records, loaded only with the dev profile.
INSERT INTO schools (id, name, logo_url) VALUES (1, 'School name', '/assets/school.svg');
INSERT INTO students (id, school_id, name, class_name, avatar_url)
VALUES (1, 1, 'Jessica John Jones', 'FS1 Acacia', '/assets/student.png');
INSERT INTO fee_summaries (student_id, annual_fee, currency, interest_rate)
VALUES (1, 340000.00, 'INR', 0.00);
