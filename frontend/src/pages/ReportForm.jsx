import React, { useState, useEffect } from "react";
import { useAuth } from "../utils/auth";
import { api, API_ENDPOINTS } from "../utils/api";

export default function ReportForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

  const initialFormState = {
    faculty_id: "",
    class_id: "",
    week_of_reporting: "",
    lecture_date: new Date().toISOString().split("T")[0],
    course_id: "",
    actual_present: "",
    total_registered: "",
    venue: "",
    scheduled_time: "",
    topic: "",
    learning_outcomes: "",
    recommendations: "",
  };

  const [form, setForm] = useState(initialFormState);

  // Fetch dropdown data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [facRes, courseRes, classRes] = await Promise.all([
          api.get(API_ENDPOINTS.FACULTIES, true),
          api.get(API_ENDPOINTS.COURSES, true),
          api.get(API_ENDPOINTS.CLASSES, true)
        ]);
        setFaculties(facRes.data || []);
        setCourses(courseRes.data || []);
        setClasses(classRes.data || []);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setErrors({ general: "Failed to load form data. Please refresh the page." });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch course details when course_id changes
  useEffect(() => {
    async function fetchCourseDetails() {
      if (!form.course_id) {
        setForm((prev) => ({ ...prev, total_registered: "" }));
        return;
      }
      try {
        const res = await api.get(`${API_ENDPOINTS.COURSES}/${form.course_id}`, true);
        if (res.success) {
          setForm((prev) => ({
            ...prev,
            total_registered: res.data.total_registered || "",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch course details:", err);
      }
    }
    fetchCourseDetails();
  }, [form.course_id]);

  // Fetch class details when class_id changes
  useEffect(() => {
    async function fetchClassDetails() {
      if (!form.class_id) {
        setForm((prev) => ({ ...prev, venue: "", scheduled_time: "" }));
        return;
      }
      try {
        const selectedClass = classes.find((cl) => cl.id === parseInt(form.class_id));
        if (selectedClass) {
          setForm((prev) => ({
            ...prev,
            venue: selectedClass.venue || "",
            scheduled_time: selectedClass.scheduled_time || "",
            course_id: selectedClass.course_id || prev.course_id,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch class details:", err);
      }
    }
    fetchClassDetails();
  }, [form.class_id, classes]);

  // Validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case "actual_present":
        if (value && form.total_registered && parseInt(value) > parseInt(form.total_registered)) {
          newErrors.actual_present = "Actual present cannot exceed total registered";
        } else delete newErrors.actual_present;
        break;
      case "lecture_date":
        if (new Date(value) > new Date()) newErrors.lecture_date = "Lecture date cannot be in the future";
        else delete newErrors.lecture_date;
        break;
      case "week_of_reporting":
        if (value && (parseInt(value) < 1 || parseInt(value) > 52)) newErrors.week_of_reporting = "Week must be between 1 and 52";
        else delete newErrors.week_of_reporting;
        break;
      default:
        if (!value && ["faculty_id", "class_id", "course_id", "week_of_reporting", "lecture_date"].includes(name))
          newErrors[name] = "This field is required";
        else delete newErrors[name];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const requiredFields = ["faculty_id", "class_id", "course_id", "week_of_reporting", "lecture_date", "actual_present"];
    const newErrors = {};
    requiredFields.forEach((f) => {
      if (!form[f]) newErrors[f] = "This field is required";
    });
    if (form.actual_present && form.total_registered && parseInt(form.actual_present) > parseInt(form.total_registered)) {
      newErrors.actual_present = "Actual present cannot exceed total registered";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setErrors({ ...errors, general: "Please fix the form errors before submitting." });
      return;
    }
    try {
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.REPORTS, form, true);
      if (response.success) {
        setSuccess(true);
        setForm(initialFormState);
        setErrors({});
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setErrors({ general: err.message || "Failed to submit report" });
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
  };

  // UI Helpers
  const InputField = ({ label, name, type = "text", value, onChange, error, className = "mb-3", ...rest }) => (
    <div className={className}>
      <label className="form-label fw-semibold text-dark">{label}</label>
      <input 
        type={type} 
        name={name} 
        className={`form-control ${error ? "is-invalid" : ""}`} 
        value={value} 
        onChange={(e) => {
          onChange(e);
          validateField(name, e.target.value);
        }}
        {...rest} 
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );

  const TextArea = ({ label, name, value, onChange, error, rows = 3, required }) => (
    <div className="mb-3">
      <label className="form-label fw-semibold text-dark">{label}</label>
      <textarea 
        name={name} 
        className={`form-control ${error ? "is-invalid" : ""}`} 
        value={value} 
        onChange={onChange} 
        rows={rows} 
        required={required}
        placeholder={`Enter ${label.toLowerCase()}...`}
      ></textarea>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );

  const SelectInput = ({ label, name, options, value, onChange, error, required, optionLabel, className = "col-md-4 mb-3" }) => (
    <div className={className}>
      <label className="form-label fw-semibold text-dark">{label}</label>
      <select 
        name={name} 
        className={`form-select ${error ? "is-invalid" : ""}`} 
        value={value} 
        onChange={(e) => {
          onChange(e);
          validateField(name, e.target.value);
        }}
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {typeof optionLabel === "function" ? optionLabel(opt) : opt[optionLabel]}
          </option>
        ))}
      </select>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );

  if (loading && faculties.length === 0) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading form...</span>
            </div>
            <p className="text-muted">Loading report form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="card shadow border-0 rounded-4 overflow-hidden">
        <div className="card-header bg-gradient-primary text-white py-4 border-0">
          <div className="d-flex align-items-center">
            <i className="fas fa-clipboard-list fa-2x me-3"></i>
            <div>
              <h4 className="mb-1 fw-bold">Lecture Reporting Form</h4>
              <small className="opacity-75">Submit detailed reports for your lectures</small>
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          {errors.general && (
            <div className="alert alert-danger d-flex align-items-center rounded-3" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>{errors.general}</div>
            </div>
          )}

          {success && (
            <div className="alert alert-success d-flex align-items-center rounded-3" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              <div>
                <strong>Success!</strong> Report submitted successfully.
              </div>
            </div>
          )}

          {/* Lecturer Info */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-info border-0 rounded-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-user-circle me-3"></i>
                  <div>
                    <strong>Reporting as:</strong> {user?.first_name} {user?.last_name} 
                    <span className="badge bg-dark ms-2 text-capitalize">{user?.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Faculty, Course, Class */}
            <div className="row mb-4">
              <SelectInput 
                label="Faculty" 
                name="faculty_id" 
                options={faculties} 
                value={form.faculty_id} 
                onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} 
                error={errors.faculty_id} 
                optionLabel="name" 
                required 
              />
              <SelectInput 
                label="Course" 
                name="course_id" 
                options={courses} 
                value={form.course_id} 
                onChange={(e) => setForm({ ...form, course_id: e.target.value })} 
                error={errors.course_id} 
                optionLabel={(c) => `${c.course_name} (${c.code})`} 
                required 
              />
              <SelectInput 
                label="Class" 
                name="class_id" 
                options={classes} 
                value={form.class_id} 
                onChange={(e) => setForm({ ...form, class_id: e.target.value })} 
                error={errors.class_id} 
                optionLabel={(cl) => `${cl.class_name} - ${cl.course_name}`} 
                required 
              />
            </div>

            {/* Schedule */}
            <div className="row mb-4">
              <InputField 
                label="Week of Reporting" 
                name="week_of_reporting" 
                type="number" 
                min="1" 
                max="52" 
                value={form.week_of_reporting} 
                onChange={(e) => setForm({ ...form, week_of_reporting: e.target.value })} 
                error={errors.week_of_reporting} 
                className="col-md-4 mb-3" 
                required 
              />
              <InputField 
                label="Date of Lecture" 
                name="lecture_date" 
                type="date" 
                value={form.lecture_date} 
                onChange={(e) => setForm({ ...form, lecture_date: e.target.value })} 
                error={errors.lecture_date} 
                className="col-md-4 mb-3" 
                required 
              />
              <InputField 
                label="Scheduled Time" 
                name="scheduled_time" 
                value={form.scheduled_time} 
                onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} 
                className="col-md-4 mb-3" 
                readOnly 
              />
            </div>

            {/* Attendance */}
            <div className="row mb-4">
              <InputField 
                label="Actual Present" 
                name="actual_present" 
                type="number" 
                min="0" 
                value={form.actual_present} 
                onChange={(e) => setForm({ ...form, actual_present: e.target.value })} 
                error={errors.actual_present} 
                className="col-md-4 mb-3" 
                required 
              />
              <InputField 
                label="Total Registered" 
                name="total_registered" 
                type="number" 
                value={form.total_registered} 
                readOnly 
                className="col-md-4 mb-3" 
              />
              <InputField 
                label="Venue" 
                name="venue" 
                value={form.venue} 
                onChange={(e) => setForm({ ...form, venue: e.target.value })} 
                className="col-md-4 mb-3" 
                readOnly 
              />
            </div>

            {/* Content */}
            <div className="row mb-4">
              <div className="col-12">
                <TextArea 
                  label="Topic Taught" 
                  name="topic" 
                  value={form.topic} 
                  onChange={(e) => setForm({ ...form, topic: e.target.value })} 
                  required 
                />
                <TextArea 
                  label="Learning Outcomes" 
                  name="learning_outcomes" 
                  value={form.learning_outcomes} 
                  onChange={(e) => setForm({ ...form, learning_outcomes: e.target.value })} 
                  required 
                />
                <TextArea 
                  label="Recommendations & Notes" 
                  name="recommendations" 
                  value={form.recommendations} 
                  onChange={(e) => setForm({ ...form, recommendations: e.target.value })} 
                />
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-3 justify-content-end border-top pt-4">
              <button 
                type="button" 
                className="btn btn-outline-secondary rounded-pill px-4" 
                onClick={resetForm} 
                disabled={loading}
              >
                <i className="fas fa-eraser me-2"></i>
                Clear Form
              </button>
              <button 
                className="btn btn-primary rounded-pill px-4" 
                type="submit" 
                disabled={loading || Object.keys(errors).length > 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}