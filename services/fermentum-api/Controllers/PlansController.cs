using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using Fermentum.Auth.Models;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlansController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<PlansController> _logger;

        public PlansController(AuthDbContext context, ILogger<PlansController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all available plans
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Plan>>> GetPlans()
        {
            try
            {
                var plans = await _context.Plans
                    .OrderBy(p => p.BreweryLimit == -1 ? int.MaxValue : p.BreweryLimit) // Put unlimited plans last
                    .ThenBy(p => p.UserLimit)
                    .ToListAsync();

                return Ok(plans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving plans");
                return StatusCode(500, new { message = "Error retrieving plans" });
            }
        }

        /// <summary>
        /// Get a specific plan by ID
        /// </summary>
        [HttpGet("{planId:guid}")]
        public async Task<ActionResult<Plan>> GetPlan(Guid planId)
        {
            try
            {
                var plan = await _context.Plans.FindAsync(planId);

                if (plan == null)
                {
                    return NotFound(new { message = "Plan not found" });
                }

                return Ok(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving plan {PlanId}", planId);
                return StatusCode(500, new { message = "Error retrieving plan" });
            }
        }

        /// <summary>
        /// Get plan by name
        /// </summary>
        [HttpGet("by-name/{planName}")]
        public async Task<ActionResult<Plan>> GetPlanByName(string planName)
        {
            try
            {
                var plan = await _context.Plans
                    .FirstOrDefaultAsync(p => p.Name.ToLower() == planName.ToLower());

                if (plan == null)
                {
                    return NotFound(new { message = "Plan not found" });
                }

                return Ok(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving plan by name {PlanName}", planName);
                return StatusCode(500, new { message = "Error retrieving plan" });
            }
        }
    }
}