using FermentumApi.Models;

namespace FermentumApi.Services
{
    public interface IAssignmentService
    {
        // Assignment CRUD operations
        Task<AssignmentDto?> GetAssignmentByIdAsync(Guid assignmentId, Guid userId, Guid tenantId);
        Task<IEnumerable<AssignmentDto>> GetAssignmentsAsync(Guid userId, Guid tenantId, AssignmentFilters? filters = null);
        Task<Guid> CreateAssignmentAsync(CreateAssignmentRequest request, Guid createdBy, Guid tenantId);
        Task<bool> UpdateAssignmentAsync(Guid assignmentId, UpdateAssignmentRequest request, Guid updatedBy, Guid tenantId);
        Task<bool> DeleteAssignmentAsync(Guid assignmentId, Guid deletedBy, Guid tenantId);

        // Assignment status management
        Task<bool> AssignToEmployeeAsync(Guid assignmentId, Guid employeeId, Guid assignedBy, Guid tenantId, string? reason = null);
        Task<bool> ConfirmAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId);
        Task<bool> StartAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId);
        Task<bool> PauseAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId, string? reason = null);
        Task<bool> CompleteAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId, string? completionNotes = null, string[]? photoUrls = null);
        Task<bool> SignOffAssignmentAsync(Guid assignmentId, Guid signedOffBy, Guid tenantId, string? notes = null);
        Task<bool> CancelAssignmentAsync(Guid assignmentId, Guid cancelledBy, Guid tenantId, string? reason = null);

        // Assignment categories
        Task<IEnumerable<AssignmentCategoryDto>> GetCategoriesAsync(Guid tenantId);
        Task<AssignmentCategoryDto?> GetCategoryByIdAsync(Guid categoryId, Guid tenantId);
        Task<Guid> CreateCategoryAsync(AssignmentCategory category, Guid tenantId);
        Task<bool> UpdateCategoryAsync(Guid categoryId, AssignmentCategory category, Guid tenantId);
        Task<bool> DeleteCategoryAsync(Guid categoryId, Guid tenantId);

        // Assignment templates
        Task<IEnumerable<AssignmentTemplate>> GetTemplatesAsync(Guid tenantId);
        Task<AssignmentTemplate?> GetTemplateByIdAsync(Guid templateId, Guid tenantId);
        Task<Guid> CreateTemplateAsync(AssignmentTemplate template, Guid tenantId);
        Task<bool> UpdateTemplateAsync(Guid templateId, AssignmentTemplate template, Guid tenantId);
        Task<bool> DeleteTemplateAsync(Guid templateId, Guid tenantId);
        Task<Guid> CreateAssignmentFromTemplateAsync(Guid templateId, Guid? assignedTo, DateTime? dueDate, Guid createdBy, Guid tenantId);

        // Assignment comments
        Task<IEnumerable<AssignmentComment>> GetAssignmentCommentsAsync(Guid assignmentId, Guid tenantId);
        Task<Guid> AddCommentAsync(Guid assignmentId, string commentText, Guid userId, Guid tenantId, bool isInternal = false, string[]? photoUrls = null);

        // Assignment reporting and analytics
        Task<AssignmentSummaryDto> GetAssignmentSummaryAsync(Guid tenantId, DateTime? startDate = null, DateTime? endDate = null);
        Task<IEnumerable<AssignmentDto>> GetMyAssignmentsAsync(Guid employeeId, Guid tenantId, AssignmentStatus? status = null);
        Task<IEnumerable<AssignmentDto>> GetMyAssignmentsByUserIdAsync(Guid userId, Guid tenantId, AssignmentStatus? status = null);
        Task<IEnumerable<AssignmentDto>> GetOverdueAssignmentsAsync(Guid tenantId);
        Task<IEnumerable<AssignmentDto>> GetAssignmentsDueTodayAsync(Guid tenantId);

        // User to Employee mapping
        Task<Models.Employee?> GetEmployeeByUserIdAsync(Guid userId, Guid tenantId);

        // Recurring assignments
        Task<bool> ProcessRecurringAssignmentsAsync(); // Background job to create instances
        Task<bool> UpdateRecurrencePatternAsync(Guid assignmentId, RecurrencePatternDto pattern, Guid updatedBy, Guid tenantId);
    }

    public class AssignmentFilters
    {
        public AssignmentStatus? Status { get; set; }
        public AssignmentPriority? Priority { get; set; }
        public Guid? CategoryId { get; set; }
        public Guid? AssignedTo { get; set; }
        public Guid? AssignedBy { get; set; }
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public bool? RequiresSignoff { get; set; }
        public bool? IsOverdue { get; set; }
        public string? SearchTerm { get; set; }
        public int? Limit { get; set; }
        public int? Offset { get; set; }
        public string? SortBy { get; set; } = "Created"; // Created, DueDate, Priority, Status, Title
        public string? SortOrder { get; set; } = "desc"; // asc, desc
    }
}