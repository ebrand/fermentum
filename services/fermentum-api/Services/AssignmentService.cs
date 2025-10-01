using Microsoft.EntityFrameworkCore;
using FermentumApi.Models;
using Fermentum.Auth.Data;
using Fermentum.Auth.Models;
using System.Linq.Expressions;

namespace FermentumApi.Services
{
    public class AssignmentService : IAssignmentService
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<AssignmentService> _logger;

        public AssignmentService(AuthDbContext context, ILogger<AssignmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<AssignmentDto?> GetAssignmentByIdAsync(Guid assignmentId, Guid userId, Guid tenantId)
        {
            var assignment = await _context.Set<Assignment>()
                .Include(a => a.Category)
                .Include(a => a.AssignedToEmployee)
                .Include(a => a.AssignedByUser)
                .Include(a => a.SignedOffByUser)
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId)
                .FirstOrDefaultAsync();

            return assignment == null ? null : MapToDto(assignment);
        }

        public async Task<IEnumerable<AssignmentDto>> GetAssignmentsAsync(Guid userId, Guid tenantId, AssignmentFilters? filters = null)
        {
            var query = _context.Set<Assignment>()
                .Include(a => a.Category)
                .Include(a => a.AssignedToEmployee)
                .Include(a => a.AssignedByUser)
                .Include(a => a.SignedOffByUser)
                .Where(a => a.TenantId == tenantId && a.IsActive);

            // Apply filters
            if (filters != null)
            {
                if (filters.Status.HasValue)
                    query = query.Where(a => a.Status == filters.Status.Value);

                if (filters.Priority.HasValue)
                    query = query.Where(a => a.Priority == filters.Priority.Value);

                if (filters.CategoryId.HasValue)
                    query = query.Where(a => a.CategoryId == filters.CategoryId.Value);

                if (filters.AssignedTo.HasValue)
                    query = query.Where(a => a.AssignedTo == filters.AssignedTo.Value);

                if (filters.AssignedBy.HasValue)
                    query = query.Where(a => a.AssignedBy == filters.AssignedBy.Value);

                if (filters.DueDateFrom.HasValue)
                    query = query.Where(a => a.DueDate >= filters.DueDateFrom.Value);

                if (filters.DueDateTo.HasValue)
                    query = query.Where(a => a.DueDate <= filters.DueDateTo.Value);

                if (filters.CreatedFrom.HasValue)
                    query = query.Where(a => a.Created >= filters.CreatedFrom.Value);

                if (filters.CreatedTo.HasValue)
                    query = query.Where(a => a.Created <= filters.CreatedTo.Value);

                if (filters.RequiresSignoff.HasValue)
                    query = query.Where(a => a.RequiresSignoff == filters.RequiresSignoff.Value);

                if (filters.IsOverdue.HasValue && filters.IsOverdue.Value)
                    query = query.Where(a => a.DueDate < DateTime.UtcNow && a.Status != AssignmentStatus.Completed);

                if (!string.IsNullOrEmpty(filters.SearchTerm))
                {
                    var searchTerm = filters.SearchTerm.ToLower();
                    query = query.Where(a =>
                        a.Title.ToLower().Contains(searchTerm) ||
                        (a.Description != null && a.Description.ToLower().Contains(searchTerm)) ||
                        (a.Location != null && a.Location.ToLower().Contains(searchTerm)));
                }

                // Apply sorting
                if (!string.IsNullOrEmpty(filters.SortBy))
                {
                    var isDescending = filters.SortOrder?.ToLower() == "desc";

                    query = filters.SortBy.ToLower() switch
                    {
                        "created" => isDescending ? query.OrderByDescending(a => a.Created) : query.OrderBy(a => a.Created),
                        "duedate" => isDescending ? query.OrderByDescending(a => a.DueDate) : query.OrderBy(a => a.DueDate),
                        "priority" => isDescending ? query.OrderByDescending(a => a.Priority) : query.OrderBy(a => a.Priority),
                        "status" => isDescending ? query.OrderByDescending(a => a.Status) : query.OrderBy(a => a.Status),
                        "title" => isDescending ? query.OrderByDescending(a => a.Title) : query.OrderBy(a => a.Title),
                        _ => query.OrderByDescending(a => a.Created)
                    };
                }
                else
                {
                    query = query.OrderByDescending(a => a.Created);
                }

                // Apply pagination
                if (filters.Offset.HasValue)
                    query = query.Skip(filters.Offset.Value);

                if (filters.Limit.HasValue)
                    query = query.Take(filters.Limit.Value);
            }
            else
            {
                query = query.OrderByDescending(a => a.Created);
            }

            var assignments = await query.ToListAsync();
            return assignments.Select(MapToDto);
        }

        public async Task<Guid> CreateAssignmentAsync(CreateAssignmentRequest request, Guid createdBy, Guid tenantId)
        {
            var assignment = new Assignment
            {
                AssignmentId = Guid.NewGuid(),
                TenantId = tenantId,
                Title = request.Title,
                Description = request.Description,
                Instructions = request.Instructions,
                Priority = request.Priority,
                Status = AssignmentStatus.Pending,
                AssignedBy = createdBy,
                AssignedTo = request.AssignedTo,
                DueDate = request.DueDate,
                EstimatedDurationMinutes = request.EstimatedDurationMinutes,
                Location = request.Location,
                CategoryId = request.CategoryId,
                RequiresConfirmation = request.RequiresConfirmation,
                RequiresPhotos = request.RequiresPhotos,
                RequiresSignoff = request.RequiresSignoff,
                IsRecurring = request.IsRecurring,
                CreatedBy = createdBy,
                Created = DateTime.UtcNow,
                Updated = DateTime.UtcNow
            };

            if (request.RecurrencePattern != null)
            {
                assignment.SetRecurrencePattern(request.RecurrencePattern);
            }

            // If assigned to someone, set status to Assigned
            if (request.AssignedTo.HasValue)
            {
                assignment.Status = AssignmentStatus.Assigned;
            }

            _context.Set<Assignment>().Add(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created assignment {AssignmentId} for tenant {TenantId}", assignment.AssignmentId, tenantId);
            return assignment.AssignmentId;
        }

        public async Task<bool> UpdateAssignmentAsync(Guid assignmentId, UpdateAssignmentRequest request, Guid updatedBy, Guid tenantId)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            var oldStatus = assignment.Status;

            // Update fields if provided
            if (!string.IsNullOrEmpty(request.Title))
                assignment.Title = request.Title;

            if (request.Description != null)
                assignment.Description = request.Description;

            if (request.Instructions != null)
                assignment.Instructions = request.Instructions;

            if (request.Priority.HasValue)
                assignment.Priority = request.Priority.Value;

            if (request.Status.HasValue)
                assignment.Status = request.Status.Value;

            if (request.CategoryId.HasValue)
                assignment.CategoryId = request.CategoryId.Value;

            if (request.AssignedTo.HasValue)
                assignment.AssignedTo = request.AssignedTo.Value;

            if (request.DueDate.HasValue)
                assignment.DueDate = request.DueDate.Value;

            if (request.EstimatedDurationMinutes.HasValue)
                assignment.EstimatedDurationMinutes = request.EstimatedDurationMinutes.Value;

            if (request.Location != null)
                assignment.Location = request.Location;

            if (request.CompletionNotes != null)
                assignment.CompletionNotes = request.CompletionNotes;

            if (request.PhotoUrls != null)
                assignment.PhotoUrls = request.PhotoUrls;

            assignment.UpdatedBy = updatedBy;
            assignment.Updated = DateTime.UtcNow;

            // Track status changes
            if (oldStatus != assignment.Status)
            {
                await AddStatusHistoryAsync(assignmentId, oldStatus, assignment.Status, updatedBy, request.StatusChangeReason);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated assignment {AssignmentId} for tenant {TenantId}", assignmentId, tenantId);
            return true;
        }

        public async Task<bool> DeleteAssignmentAsync(Guid assignmentId, Guid deletedBy, Guid tenantId)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            assignment.IsActive = false;
            assignment.UpdatedBy = deletedBy;
            assignment.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted assignment {AssignmentId} for tenant {TenantId}", assignmentId, tenantId);
            return true;
        }

        public async Task<bool> AssignToEmployeeAsync(Guid assignmentId, Guid employeeId, Guid assignedBy, Guid tenantId, string? reason = null)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            var oldStatus = assignment.Status;
            assignment.AssignedTo = employeeId;
            assignment.Status = AssignmentStatus.Assigned;
            assignment.UpdatedBy = assignedBy;
            assignment.Updated = DateTime.UtcNow;

            await AddStatusHistoryAsync(assignmentId, oldStatus, AssignmentStatus.Assigned, assignedBy, reason);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ConfirmAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId && a.AssignedTo == employeeId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            // Get the UserId for the employee to record in status history
            var userId = await GetUserIdFromEmployeeIdAsync(employeeId);
            if (userId == null)
            {
                _logger.LogError("Employee {EmployeeId} does not have an associated UserId", employeeId);
                return false;
            }

            var oldStatus = assignment.Status;
            assignment.Status = AssignmentStatus.Accepted;
            assignment.ConfirmedAt = DateTime.UtcNow;
            assignment.Updated = DateTime.UtcNow;

            await AddStatusHistoryAsync(assignmentId, oldStatus, AssignmentStatus.Accepted, userId.Value, "Assignment accepted by employee");
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> StartAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId && a.AssignedTo == employeeId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            // Get the UserId for the employee to record in status history
            var userId = await GetUserIdFromEmployeeIdAsync(employeeId);
            if (userId == null)
            {
                _logger.LogError("Employee {EmployeeId} does not have an associated UserId", employeeId);
                return false;
            }

            var oldStatus = assignment.Status;
            assignment.Status = AssignmentStatus.InProgress;
            assignment.ActualStartTime = DateTime.UtcNow;
            assignment.Updated = DateTime.UtcNow;

            await AddStatusHistoryAsync(assignmentId, oldStatus, AssignmentStatus.InProgress, userId.Value, "Assignment started");
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> PauseAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId, string? reason = null)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId && a.AssignedTo == employeeId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            // Get the UserId for the employee to record in status history
            var userId = await GetUserIdFromEmployeeIdAsync(employeeId);
            if (userId == null)
            {
                _logger.LogError("Employee {EmployeeId} does not have an associated UserId", employeeId);
                return false;
            }

            var oldStatus = assignment.Status;
            assignment.Status = AssignmentStatus.Paused;
            assignment.Updated = DateTime.UtcNow;

            await AddStatusHistoryAsync(assignmentId, oldStatus, AssignmentStatus.Paused, userId.Value, reason);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CompleteAssignmentAsync(Guid assignmentId, Guid employeeId, Guid tenantId, string? completionNotes = null, string[]? photoUrls = null)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId && a.AssignedTo == employeeId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            // Get the UserId for the employee to record in status history
            var userId = await GetUserIdFromEmployeeIdAsync(employeeId);
            if (userId == null)
            {
                _logger.LogError("Employee {EmployeeId} does not have an associated UserId", employeeId);
                return false;
            }

            var oldStatus = assignment.Status;
            assignment.Status = AssignmentStatus.Completed;
            assignment.ActualCompletionTime = DateTime.UtcNow;
            assignment.CompletionNotes = completionNotes;
            assignment.PhotoUrls = photoUrls;
            assignment.Updated = DateTime.UtcNow;

            await AddStatusHistoryAsync(assignmentId, oldStatus, AssignmentStatus.Completed, userId.Value, "Assignment completed");
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> SignOffAssignmentAsync(Guid assignmentId, Guid signedOffBy, Guid tenantId, string? notes = null)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            assignment.SignedOffBy = signedOffBy;
            assignment.SignedOffAt = DateTime.UtcNow;
            assignment.Updated = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(notes))
            {
                await AddCommentAsync(assignmentId, $"Signed off: {notes}", signedOffBy, tenantId, true);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelAssignmentAsync(Guid assignmentId, Guid cancelledBy, Guid tenantId, string? reason = null)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            var oldStatus = assignment.Status;
            assignment.Status = AssignmentStatus.Cancelled;
            assignment.UpdatedBy = cancelledBy;
            assignment.Updated = DateTime.UtcNow;

            await AddStatusHistoryAsync(assignmentId, oldStatus, AssignmentStatus.Cancelled, cancelledBy, reason);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<AssignmentCategoryDto>> GetCategoriesAsync(Guid tenantId)
        {
            var categories = await _context.Set<AssignmentCategory>()
                .Where(c => c.TenantId == tenantId && c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return categories.Select(c => new AssignmentCategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                Color = c.Color,
                IsActive = c.IsActive
            });
        }

        public async Task<AssignmentCategoryDto?> GetCategoryByIdAsync(Guid categoryId, Guid tenantId)
        {
            var category = await _context.Set<AssignmentCategory>()
                .Where(c => c.CategoryId == categoryId && c.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (category == null)
                return null;

            return new AssignmentCategoryDto
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                IsActive = category.IsActive
            };
        }

        public async Task<Guid> CreateCategoryAsync(AssignmentCategory category, Guid tenantId)
        {
            category.CategoryId = Guid.NewGuid();
            category.TenantId = tenantId;
            category.Created = DateTime.UtcNow;
            category.Updated = DateTime.UtcNow;

            _context.Set<AssignmentCategory>().Add(category);
            await _context.SaveChangesAsync();

            return category.CategoryId;
        }

        public async Task<bool> UpdateCategoryAsync(Guid categoryId, AssignmentCategory category, Guid tenantId)
        {
            var existingCategory = await _context.Set<AssignmentCategory>()
                .Where(c => c.CategoryId == categoryId && c.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (existingCategory == null)
                return false;

            existingCategory.Name = category.Name;
            existingCategory.Description = category.Description;
            existingCategory.Color = category.Color;
            existingCategory.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCategoryAsync(Guid categoryId, Guid tenantId)
        {
            var category = await _context.Set<AssignmentCategory>()
                .Where(c => c.CategoryId == categoryId && c.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (category == null)
                return false;

            category.IsActive = false;
            category.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<AssignmentTemplate>> GetTemplatesAsync(Guid tenantId)
        {
            return await _context.Set<AssignmentTemplate>()
                .Where(t => t.TenantId == tenantId && t.IsActive)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        public async Task<AssignmentTemplate?> GetTemplateByIdAsync(Guid templateId, Guid tenantId)
        {
            return await _context.Set<AssignmentTemplate>()
                .Where(t => t.TemplateId == templateId && t.TenantId == tenantId)
                .FirstOrDefaultAsync();
        }

        public async Task<Guid> CreateTemplateAsync(AssignmentTemplate template, Guid tenantId)
        {
            template.TemplateId = Guid.NewGuid();
            template.TenantId = tenantId;
            template.Created = DateTime.UtcNow;
            template.Updated = DateTime.UtcNow;

            _context.Set<AssignmentTemplate>().Add(template);
            await _context.SaveChangesAsync();

            return template.TemplateId;
        }

        public async Task<bool> UpdateTemplateAsync(Guid templateId, AssignmentTemplate template, Guid tenantId)
        {
            var existingTemplate = await _context.Set<AssignmentTemplate>()
                .Where(t => t.TemplateId == templateId && t.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (existingTemplate == null)
                return false;

            existingTemplate.Name = template.Name;
            existingTemplate.Title = template.Title;
            existingTemplate.Description = template.Description;
            existingTemplate.Instructions = template.Instructions;
            existingTemplate.EstimatedDurationMinutes = template.EstimatedDurationMinutes;
            existingTemplate.Priority = template.Priority;
            existingTemplate.RequiresConfirmation = template.RequiresConfirmation;
            existingTemplate.RequiresPhotos = template.RequiresPhotos;
            existingTemplate.RequiresSignoff = template.RequiresSignoff;
            existingTemplate.DefaultAssigneeRole = template.DefaultAssigneeRole;
            existingTemplate.CategoryId = template.CategoryId;
            existingTemplate.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTemplateAsync(Guid templateId, Guid tenantId)
        {
            var template = await _context.Set<AssignmentTemplate>()
                .Where(t => t.TemplateId == templateId && t.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (template == null)
                return false;

            template.IsActive = false;
            template.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Guid> CreateAssignmentFromTemplateAsync(Guid templateId, Guid? assignedTo, DateTime? dueDate, Guid createdBy, Guid tenantId)
        {
            var template = await _context.Set<AssignmentTemplate>()
                .Where(t => t.TemplateId == templateId && t.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (template == null)
                throw new ArgumentException("Template not found");

            var assignment = new Assignment
            {
                AssignmentId = Guid.NewGuid(),
                TenantId = tenantId,
                Title = template.Title,
                Description = template.Description,
                Instructions = template.Instructions,
                Priority = template.Priority,
                Status = assignedTo.HasValue ? AssignmentStatus.Assigned : AssignmentStatus.Pending,
                AssignedBy = createdBy,
                AssignedTo = assignedTo,
                DueDate = dueDate,
                EstimatedDurationMinutes = template.EstimatedDurationMinutes,
                CategoryId = template.CategoryId,
                RequiresConfirmation = template.RequiresConfirmation,
                RequiresPhotos = template.RequiresPhotos,
                RequiresSignoff = template.RequiresSignoff,
                CreatedBy = createdBy,
                Created = DateTime.UtcNow,
                Updated = DateTime.UtcNow
            };

            _context.Set<Assignment>().Add(assignment);
            await _context.SaveChangesAsync();

            return assignment.AssignmentId;
        }

        public async Task<IEnumerable<AssignmentComment>> GetAssignmentCommentsAsync(Guid assignmentId, Guid tenantId)
        {
            return await _context.Set<AssignmentComment>()
                .Include(c => c.User)
                .Where(c => c.AssignmentId == assignmentId)
                .OrderBy(c => c.Created)
                .ToListAsync();
        }

        public async Task<Guid> AddCommentAsync(Guid assignmentId, string commentText, Guid userId, Guid tenantId, bool isInternal = false, string[]? photoUrls = null)
        {
            var comment = new AssignmentComment
            {
                CommentId = Guid.NewGuid(),
                AssignmentId = assignmentId,
                UserId = userId,
                CommentText = commentText,
                IsInternal = isInternal,
                PhotoUrls = photoUrls,
                Created = DateTime.UtcNow
            };

            _context.Set<AssignmentComment>().Add(comment);
            await _context.SaveChangesAsync();

            return comment.CommentId;
        }

        public async Task<AssignmentSummaryDto> GetAssignmentSummaryAsync(Guid tenantId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.Set<Assignment>()
                .Where(a => a.TenantId == tenantId && a.IsActive);

            if (startDate.HasValue)
                query = query.Where(a => a.Created >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.Created <= endDate.Value);

            var assignments = await query.ToListAsync();
            var today = DateTime.UtcNow.Date;

            var summary = new AssignmentSummaryDto
            {
                TotalAssignments = assignments.Count,
                PendingAssignments = assignments.Count(a => a.Status == AssignmentStatus.Pending),
                InProgressAssignments = assignments.Count(a => a.Status == AssignmentStatus.InProgress),
                CompletedToday = assignments.Count(a => a.Status == AssignmentStatus.Completed &&
                                                       a.ActualCompletionTime?.Date == today),
                OverdueAssignments = assignments.Count(a => a.DueDate < DateTime.UtcNow &&
                                                           a.Status != AssignmentStatus.Completed &&
                                                           a.Status != AssignmentStatus.Cancelled)
            };

            // TODO: Add category and priority breakdowns if needed
            return summary;
        }

        public async Task<IEnumerable<AssignmentDto>> GetMyAssignmentsAsync(Guid employeeId, Guid tenantId, AssignmentStatus? status = null)
        {
            var query = _context.Set<Assignment>()
                .Include(a => a.Category)
                .Include(a => a.AssignedToEmployee)
                .Include(a => a.AssignedByUser)
                .Include(a => a.SignedOffByUser)
                .Where(a => a.TenantId == tenantId && a.AssignedTo == employeeId && a.IsActive);

            if (status.HasValue)
                query = query.Where(a => a.Status == status.Value);

            var assignments = await query
                .OrderByDescending(a => a.Created)
                .ToListAsync();

            return assignments.Select(MapToDto);
        }

        public async Task<IEnumerable<AssignmentDto>> GetMyAssignmentsByUserIdAsync(Guid userId, Guid tenantId, AssignmentStatus? status = null)
        {
            // First, find the employee record for this user
            var employee = await _context.Set<Employee>()
                .FirstOrDefaultAsync(e => e.UserId == userId && e.TenantId == tenantId && e.IsActive);

            if (employee == null)
            {
                // User has no employee record, return empty list
                return new List<AssignmentDto>();
            }

            // Now get assignments for this employee
            var query = _context.Set<Assignment>()
                .Include(a => a.Category)
                .Include(a => a.AssignedToEmployee)
                .Include(a => a.AssignedByUser)
                .Include(a => a.SignedOffByUser)
                .Where(a => a.TenantId == tenantId && a.AssignedTo == employee.EmployeeId && a.IsActive);

            if (status.HasValue)
                query = query.Where(a => a.Status == status.Value);

            var assignments = await query
                .OrderByDescending(a => a.Created)
                .ToListAsync();

            return assignments.Select(MapToDto);
        }

        public async Task<IEnumerable<AssignmentDto>> GetOverdueAssignmentsAsync(Guid tenantId)
        {
            var assignments = await _context.Set<Assignment>()
                .Include(a => a.Category)
                .Include(a => a.AssignedToEmployee)
                .Include(a => a.AssignedByUser)
                .Include(a => a.SignedOffByUser)
                .Where(a => a.TenantId == tenantId &&
                           a.IsActive &&
                           a.DueDate < DateTime.UtcNow &&
                           a.Status != AssignmentStatus.Completed &&
                           a.Status != AssignmentStatus.Cancelled)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            return assignments.Select(MapToDto);
        }

        public async Task<IEnumerable<AssignmentDto>> GetAssignmentsDueTodayAsync(Guid tenantId)
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var assignments = await _context.Set<Assignment>()
                .Include(a => a.Category)
                .Include(a => a.AssignedToEmployee)
                .Include(a => a.AssignedByUser)
                .Include(a => a.SignedOffByUser)
                .Where(a => a.TenantId == tenantId &&
                           a.IsActive &&
                           a.DueDate >= today &&
                           a.DueDate < tomorrow &&
                           a.Status != AssignmentStatus.Completed &&
                           a.Status != AssignmentStatus.Cancelled)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            return assignments.Select(MapToDto);
        }

        public async Task<bool> ProcessRecurringAssignmentsAsync()
        {
            // TODO: Implement recurring assignment processing
            // This would be called by a background job
            return await Task.FromResult(true);
        }

        public async Task<bool> UpdateRecurrencePatternAsync(Guid assignmentId, RecurrencePatternDto pattern, Guid updatedBy, Guid tenantId)
        {
            var assignment = await _context.Set<Assignment>()
                .Where(a => a.AssignmentId == assignmentId && a.TenantId == tenantId)
                .FirstOrDefaultAsync();

            if (assignment == null)
                return false;

            assignment.SetRecurrencePattern(pattern);
            assignment.UpdatedBy = updatedBy;
            assignment.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<Guid?> GetUserIdFromEmployeeIdAsync(Guid employeeId)
        {
            var employee = await _context.Set<Models.Employee>()
                .Where(e => e.EmployeeId == employeeId)
                .FirstOrDefaultAsync();
            return employee?.UserId;
        }

        private async Task AddStatusHistoryAsync(Guid assignmentId, AssignmentStatus fromStatus, AssignmentStatus toStatus, Guid changedBy, string? reason = null)
        {
            var history = new AssignmentStatusHistory
            {
                HistoryId = Guid.NewGuid(),
                AssignmentId = assignmentId,
                FromStatus = fromStatus,
                ToStatus = toStatus,
                ChangedBy = changedBy,
                ChangedAt = DateTime.UtcNow,
                Reason = reason
            };

            _context.Set<AssignmentStatusHistory>().Add(history);
        }

        private static AssignmentDto MapToDto(Assignment assignment)
        {
            return new AssignmentDto
            {
                AssignmentId = assignment.AssignmentId,
                Title = assignment.Title,
                Description = assignment.Description,
                Instructions = assignment.Instructions,
                Priority = assignment.Priority,
                Status = assignment.Status,
                DueDate = assignment.DueDate,
                EstimatedDurationMinutes = assignment.EstimatedDurationMinutes,
                ActualStartTime = assignment.ActualStartTime,
                ActualCompletionTime = assignment.ActualCompletionTime,
                Location = assignment.Location,
                RequiresConfirmation = assignment.RequiresConfirmation,
                ConfirmedAt = assignment.ConfirmedAt,
                RequiresPhotos = assignment.RequiresPhotos,
                RequiresSignoff = assignment.RequiresSignoff,
                SignedOffAt = assignment.SignedOffAt,
                CompletionNotes = assignment.CompletionNotes,
                PhotoUrls = assignment.PhotoUrls,
                IsRecurring = assignment.IsRecurring,
                RecurrencePattern = assignment.GetRecurrencePattern(),
                Created = assignment.Created,
                Updated = assignment.Updated,
                Category = assignment.Category == null ? null : new AssignmentCategoryDto
                {
                    CategoryId = assignment.Category.CategoryId,
                    Name = assignment.Category.Name,
                    Description = assignment.Category.Description,
                    Color = assignment.Category.Color,
                    IsActive = assignment.Category.IsActive
                },
                AssignedToEmployee = assignment.AssignedToEmployee == null ? null : new EmployeeDto
                {
                    EmployeeId = assignment.AssignedToEmployee.EmployeeId,
                    UserId = assignment.AssignedToEmployee.UserId,
                    FirstName = assignment.AssignedToEmployee.FirstName,
                    LastName = assignment.AssignedToEmployee.LastName,
                    Email = assignment.AssignedToEmployee.User?.Email
                },
                AssignedByUser = assignment.AssignedByUser == null ? null : new UserDto
                {
                    UserId = assignment.AssignedByUser.UserId,
                    Email = assignment.AssignedByUser.Email,
                    FirstName = assignment.AssignedByUser.FirstName,
                    LastName = assignment.AssignedByUser.LastName
                },
                SignedOffByUser = assignment.SignedOffByUser == null ? null : new UserDto
                {
                    UserId = assignment.SignedOffByUser.UserId,
                    Email = assignment.SignedOffByUser.Email,
                    FirstName = assignment.SignedOffByUser.FirstName,
                    LastName = assignment.SignedOffByUser.LastName
                },
                CommentCount = assignment.Comments?.Count ?? 0
            };
        }

        public async Task<Models.Employee?> GetEmployeeByUserIdAsync(Guid userId, Guid tenantId)
        {
            try
            {
                // Find the first active employee record for this user in any brewery within the tenant
                var employee = await _context.Set<Models.Employee>()
                    .Where(e => e.UserId == userId && e.TenantId == tenantId && e.IsActive)
                    .FirstOrDefaultAsync();

                return employee;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding Employee for User {UserId} in Tenant {TenantId}", userId, tenantId);
                return null;
            }
        }
    }
}