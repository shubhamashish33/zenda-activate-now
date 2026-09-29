CREATE TABLE schools (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    logo_url VARCHAR(255) NOT NULL
);

CREATE TABLE students (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_student_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE fee_summaries (
    student_id BIGINT PRIMARY KEY,
    annual_fee DECIMAL(12,2) NOT NULL,
    currency CHAR(3) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    CONSTRAINT fk_fee_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT chk_annual_fee CHECK (annual_fee >= 0),
    CONSTRAINT chk_interest CHECK (interest_rate >= 0)
);

CREATE TABLE activations (
    student_id BIGINT PRIMARY KEY,
    phone VARCHAR(13) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    name_as_on_pan VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    submitted_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_activation_student FOREIGN KEY (student_id) REFERENCES students(id)
);
