using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fermentum.Auth.Data;
using FermentumApi.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json.Serialization;

namespace Fermentum.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RecipesController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly ILogger<RecipesController> _logger;

        public RecipesController(AuthDbContext context, ILogger<RecipesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return null;
            }
            return userId;
        }

        private async Task<Guid?> GetUserTenantIdAsync()
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue) return null;

            var userTenant = await _context.UserTenants
                .Where(ut => ut.UserId == currentUserId.Value && ut.IsActive)
                .FirstOrDefaultAsync();

            return userTenant?.TenantId;
        }

        // GET: api/recipes
        [HttpGet]
        public async Task<ActionResult> GetRecipes([FromQuery] bool includeInactive = false)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var query = _context.Recipes
                    .Include(r => r.Style)
                    .Include(r => r.Grains).ThenInclude(g => g.Grain)
                    .Include(r => r.Hops).ThenInclude(h => h.Hop)
                    .Include(r => r.Yeasts).ThenInclude(y => y.Yeast)
                    .Include(r => r.Additives).ThenInclude(a => a.Additive)
                    .Include(r => r.Steps).ThenInclude(s => s.EquipmentType)
                    .Where(r => r.TenantId == tenantId.Value);

                if (!includeInactive)
                {
                    query = query.Where(r => r.IsActive);
                }

                var recipes = await query
                    .OrderBy(r => r.Name)
                    .ToListAsync();

                var recipesData = recipes.Select(r => new
                {
                    RecipeId = r.RecipeId,
                    TenantId = r.TenantId,
                    StyleId = r.StyleId,
                    StyleName = r.Style?.StyleName,
                    Name = r.Name,
                    Description = r.Description,
                    BatchSize = r.BatchSize,
                    BatchSizeUnit = r.BatchSizeUnit,
                    BoilTime = r.BoilTime,
                    Efficiency = r.Efficiency,
                    EstimatedOG = r.EstimatedOG,
                    EstimatedFG = r.EstimatedFG,
                    EstimatedABV = r.EstimatedABV,
                    EstimatedIBU = r.EstimatedIBU,
                    EstimatedSRM = r.EstimatedSRM,
                    Version = r.Version,
                    IsPublished = r.IsPublished,
                    IsActive = r.IsActive,
                    Created = r.Created,
                    Updated = r.Updated,
                    Grains = r.Grains.Select(g => new
                    {
                        RecipeGrainId = g.RecipeGrainId,
                        GrainId = g.GrainId,
                        Name = g.Grain?.Name,
                        Type = g.Grain?.Type,
                        Origin = g.Grain?.Origin,
                        Supplier = g.Grain?.Supplier,
                        Color = g.Grain?.Color,
                        Potential = g.Grain?.Potential,
                        Amount = g.Amount,
                        Unit = g.Unit,
                        Percentage = g.Percentage,
                        Lovibond = g.Lovibond,
                        ExtractPotential = g.ExtractPotential,
                        MustMash = g.MustMash,
                        SortOrder = g.SortOrder,
                        Notes = g.Notes
                    }).OrderBy(g => g.SortOrder).ToList(),
                    Hops = r.Hops.Select(h => new
                    {
                        RecipeHopId = h.RecipeHopId,
                        HopId = h.HopId,
                        Name = h.Hop?.Name,
                        Origin = h.Hop?.Origin,
                        Type = h.Hop?.Type,
                        AlphaAcidMin = h.Hop?.AlphaAcidMin,
                        AlphaAcidMax = h.Hop?.AlphaAcidMax,
                        Amount = h.Amount,
                        Unit = h.Unit,
                        AdditionTime = h.AdditionTime,
                        AdditionType = h.AdditionType,
                        Purpose = h.Purpose,
                        Form = h.Form,
                        AlphaAcid = h.AlphaAcid,
                        IBUContribution = h.IBUContribution,
                        SortOrder = h.SortOrder
                    }).OrderByDescending(h => h.AdditionTime).ToList(),
                    Yeasts = r.Yeasts.Select(y => new
                    {
                        RecipeYeastId = y.RecipeYeastId,
                        YeastId = y.YeastId,
                        Name = y.Yeast?.Name,
                        Manufacturer = y.Yeast?.Manufacturer,
                        ProductId = y.Yeast?.ProductId,
                        Type = y.Yeast?.Type,
                        Form = y.Yeast?.Form,
                        AttenuationMin = y.Yeast?.AttenuationMin,
                        AttenuationMax = y.Yeast?.AttenuationMax,
                        Amount = y.Amount,
                        Unit = y.Unit,
                        Attenuation = y.Attenuation,
                        TemperatureMin = y.TemperatureMin,
                        TemperatureMax = y.TemperatureMax,
                        SortOrder = y.SortOrder
                    }).OrderBy(y => y.SortOrder).ToList(),
                    Additives = r.Additives.Select(a => new
                    {
                        RecipeAdditiveId = a.RecipeAdditiveId,
                        AdditiveId = a.AdditiveId,
                        Name = a.Additive?.Name,
                        Category = a.Additive?.Category,
                        Type = a.Additive?.Type,
                        Amount = a.Amount,
                        Unit = a.Unit,
                        AdditionTime = a.AdditionTime,
                        AdditionStage = a.AdditionStage,
                        Purpose = a.Purpose,
                        TargetParameter = a.TargetParameter,
                        TargetValue = a.TargetValue,
                        SortOrder = a.SortOrder
                    }).OrderBy(a => a.AdditionTime).ThenBy(a => a.SortOrder).ToList(),
                    Steps = r.Steps.Select(s => new
                    {
                        RecipeStepId = s.RecipeStepId,
                        StepNumber = s.StepNumber,
                        Phase = s.Phase,
                        StepName = s.StepName,
                        StepType = s.StepType,
                        Duration = s.Duration,
                        Temperature = s.Temperature,
                        TemperatureUnit = s.TemperatureUnit,
                        Amount = s.Amount,
                        AmountUnit = s.AmountUnit,
                        IngredientId = s.IngredientId,
                        IngredientType = s.IngredientType,
                        Description = s.Description,
                        Instructions = s.Instructions,
                        IsOptional = s.IsOptional,
                        AlertBefore = s.AlertBefore,
                        RequiresEquipment = s.RequiresEquipment,
                        EquipmentTypeId = s.EquipmentTypeId,
                        EquipmentTypeName = s.EquipmentType != null ? s.EquipmentType.Name : null,
                        EquipmentCapacityMin = s.EquipmentCapacityMin,
                        EquipmentCapacityUnit = s.EquipmentCapacityUnit
                    }).OrderBy(s => s.StepNumber).ToList()
                }).ToList();

                return Ok(new { success = true, data = recipesData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recipes");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/recipes/styles
        [AllowAnonymous]
        [HttpGet("styles")]
        public async Task<ActionResult> GetBeerStyles()
        {
            try
            {
                var styles = await _context.BJCPBeerStyles
                    .AsNoTracking()
                    .ToListAsync();

                // Sort by BJCP number (numeric part first, then letter suffix)
                var sortedStyles = styles
                    .OrderBy(s =>
                    {
                        if (string.IsNullOrEmpty(s.BJCPNumber)) return (0, "");
                        var numStr = new string(s.BJCPNumber.TakeWhile(char.IsDigit).ToArray());
                        return (string.IsNullOrEmpty(numStr) ? 0 : int.Parse(numStr), s.BJCPNumber);
                    })
                    .Select(s => new
                    {
                        StyleId = s.StyleId,
                        BJCPNumber = s.BJCPNumber,
                        StyleName = s.StyleName,
                        Category = s.Category,
                        IBUMin = s.IBUMin,
                        IBUMax = s.IBUMax,
                        SRMMin = s.SRMMin,
                        SRMMax = s.SRMMax,
                        ABVMin = s.ABVMin,
                        ABVMax = s.ABVMax,
                        Description = s.Description
                    })
                    .ToList();

                return Ok(new { success = true, data = sortedStyles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving beer styles");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/recipes/styles/detailed
        [HttpGet("styles/detailed")]
        public async Task<ActionResult> GetDetailedBeerStyles()
        {
            try
            {
                var styles = await _context.BJCPBeerStyles
                    .Select(s => new
                    {
                        styleId = s.StyleId,
                        bjcpNumber = s.BJCPNumber,
                        styleName = s.StyleName,
                        category = s.Category,
                        categoryName = s.Category,
                        description = s.Description,
                        appearance = s.Appearance,
                        aroma = s.Aroma,
                        flavor = s.Flavor,
                        mouthfeel = s.Mouthfeel,
                        history = s.History,
                        characteristicIngredients = s.CharacteristicIngredients,
                        styleComparison = s.StyleComparison,
                        commercialExamples = s.CommercialExamples,
                        abvMin = s.ABVMin,
                        abvMax = s.ABVMax,
                        ibuMin = s.IBUMin,
                        ibuMax = s.IBUMax,
                        srmMin = s.SRMMin,
                        srmMax = s.SRMMax,
                        ogMin = s.OGMin,
                        ogMax = s.OGMax,
                        fgMin = s.FGMin,
                        fgMax = s.FGMax
                    })
                    .OrderBy(s => s.category)
                    .ThenBy(s => s.bjcpNumber)
                    .ToListAsync();

                return Ok(new { success = true, data = styles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving detailed beer styles");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/recipes/styles/{id}/full
        [HttpGet("styles/{id}/full")]
        public async Task<ActionResult> GetFullBeerStyle(Guid id)
        {
            try
            {
                var style = await _context.BJCPBeerStyles
                    .Where(s => s.StyleId == id)
                    .Select(s => new
                    {
                        styleId = s.StyleId,
                        bjcpNumber = s.BJCPNumber,
                        styleName = s.StyleName,
                        category = s.Category,
                        categoryName = s.Category,
                        description = s.Description,
                        appearance = s.Appearance,
                        aroma = s.Aroma,
                        flavor = s.Flavor,
                        mouthfeel = s.Mouthfeel,
                        comments = s.Comments,
                        history = s.History,
                        characteristicIngredients = s.CharacteristicIngredients,
                        styleComparison = s.StyleComparison,
                        commercialExamples = s.CommercialExamples,
                        abvMin = s.ABVMin,
                        abvMax = s.ABVMax,
                        ibuMin = s.IBUMin,
                        ibuMax = s.IBUMax,
                        srmMin = s.SRMMin,
                        srmMax = s.SRMMax,
                        ogMin = s.OGMin,
                        ogMax = s.OGMax,
                        fgMin = s.FGMin,
                        fgMax = s.FGMax
                    })
                    .FirstOrDefaultAsync();

                if (style == null)
                {
                    return NotFound(new { success = false, message = "Beer style not found" });
                }

                // Get characteristics
                var characteristics = await _context.BJCPStyleCharacteristics
                    .Where(c => c.StyleId == id)
                    .Select(c => new
                    {
                        characteristicType = c.CharacteristicType,
                        description = c.Description,
                        keywords = c.Keywords,
                        priority = c.Priority
                    })
                    .OrderBy(c => c.characteristicType)
                    .ThenBy(c => c.priority)
                    .ToListAsync();

                // Get commercial examples
                var examples = await _context.BJCPCommercialExamples
                    .Where(e => e.StyleId == id && e.IsActive)
                    .Select(e => new
                    {
                        beerName = e.BeerName,
                        breweryName = e.BreweryName,
                        country = e.Country,
                        availability = e.Availability,
                        notes = e.Notes
                    })
                    .OrderBy(e => e.beerName)
                    .ToListAsync();

                // Get style tags
                var tags = await _context.BJCPStyleTagMappings
                    .Where(m => m.StyleId == id)
                    .Include(m => m.StyleTag)
                    .Select(m => new
                    {
                        tagName = m.StyleTag.TagName,
                        category = m.StyleTag.Category,
                        color = m.StyleTag.Color
                    })
                    .OrderBy(t => t.category)
                    .ThenBy(t => t.tagName)
                    .ToListAsync();

                return Ok(new {
                    success = true,
                    data = new {
                        style = style,
                        characteristics = characteristics,
                        commercialExamples = examples,
                        tags = tags
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving full beer style details");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/recipes/styles/categories
        [AllowAnonymous]
        [HttpGet("styles/categories")]
        public async Task<ActionResult> GetBeerCategories()
        {
            try
            {
                var categories = await _context.BJCPBeerCategories
                    .AsNoTracking()
                    .Select(c => new
                    {
                        categoryId = c.CategoryId,
                        categoryNumber = c.CategoryNumber,
                        categoryName = c.CategoryName,
                        description = c.Description,
                        sortOrder = c.SortOrder
                    })
                    .OrderBy(c => c.sortOrder)
                    .ToListAsync();

                return Ok(new { success = true, data = categories });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving beer categories");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/recipes/styles/tags
        [HttpGet("styles/tags")]
        public async Task<ActionResult> GetStyleTags()
        {
            try
            {
                var tags = await _context.BJCPStyleTags
                    .Select(t => new
                    {
                        tagId = t.TagId,
                        tagName = t.TagName,
                        category = t.Category,
                        description = t.Description,
                        color = t.Color,
                        sortOrder = t.SortOrder
                    })
                    .OrderBy(t => t.category)
                    .ThenBy(t => t.sortOrder)
                    .ThenBy(t => t.tagName)
                    .ToListAsync();

                return Ok(new { success = true, data = tags });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving style tags");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // GET: api/recipes/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetRecipe(Guid id)
        {
            try
            {
                var tenantId = await GetUserTenantIdAsync();
                if (!tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "No active tenant found" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var recipe = await _context.Recipes
                    .Include(r => r.Style)
                    .Include(r => r.Grains).ThenInclude(g => g.Grain)
                    .Include(r => r.Hops).ThenInclude(h => h.Hop)
                    .Include(r => r.Yeasts).ThenInclude(y => y.Yeast)
                    .Include(r => r.Additives).ThenInclude(a => a.Additive)
                    .Include(r => r.Steps).ThenInclude(s => s.EquipmentType)
                    // Commented out - RecipeMashStep table doesn't exist, using RecipeStep instead
                    // .Include(r => r.MashSteps)
                    .Where(r => r.RecipeId == id && r.TenantId == tenantId.Value)
                    .FirstOrDefaultAsync();

                if (recipe == null)
                {
                    return NotFound(new { success = false, message = "Recipe not found" });
                }

                var recipeData = new
                {
                    RecipeId = recipe.RecipeId,
                    TenantId = recipe.TenantId,
                    StyleId = recipe.StyleId,
                    StyleName = recipe.Style?.StyleName,
                    Name = recipe.Name,
                    Description = recipe.Description,
                    BatchSize = recipe.BatchSize,
                    BatchSizeUnit = recipe.BatchSizeUnit,
                    BoilTime = recipe.BoilTime,
                    Efficiency = recipe.Efficiency,
                    EstimatedOG = recipe.EstimatedOG,
                    EstimatedFG = recipe.EstimatedFG,
                    EstimatedABV = recipe.EstimatedABV,
                    EstimatedIBU = recipe.EstimatedIBU,
                    EstimatedSRM = recipe.EstimatedSRM,
                    Version = recipe.Version,
                    IsPublished = recipe.IsPublished,
                    IsActive = recipe.IsActive,
                    Created = recipe.Created,
                    Updated = recipe.Updated,
                    Grains = recipe.Grains.Select(g => new
                    {
                        RecipeGrainId = g.RecipeGrainId,
                        GrainId = g.GrainId,
                        Name = g.Grain?.Name,
                        Type = g.Grain?.Type,
                        Origin = g.Grain?.Origin,
                        Supplier = g.Grain?.Supplier,
                        Color = g.Grain?.Color,
                        Potential = g.Grain?.Potential,
                        Amount = g.Amount,
                        Unit = g.Unit,
                        Percentage = g.Percentage,
                        Lovibond = g.Lovibond,
                        ExtractPotential = g.ExtractPotential,
                        MustMash = g.MustMash,
                        SortOrder = g.SortOrder,
                        Notes = g.Notes
                    }).OrderBy(g => g.SortOrder),
                    Hops = recipe.Hops.Select(h => new
                    {
                        RecipeHopId = h.RecipeHopId,
                        HopId = h.HopId,
                        Name = h.Hop?.Name,
                        Origin = h.Hop?.Origin,
                        Type = h.Hop?.Type,
                        AlphaAcidMin = h.Hop?.AlphaAcidMin,
                        AlphaAcidMax = h.Hop?.AlphaAcidMax,
                        Amount = h.Amount,
                        Unit = h.Unit,
                        AdditionTime = h.AdditionTime,
                        AdditionType = h.AdditionType,
                        Purpose = h.Purpose,
                        Form = h.Form,
                        AlphaAcid = h.AlphaAcid
                    }).OrderByDescending(h => h.AdditionTime),
                    Yeasts = recipe.Yeasts.Select(y => new
                    {
                        RecipeYeastId = y.RecipeYeastId,
                        YeastId = y.YeastId,
                        Name = y.Yeast?.Name,
                        Manufacturer = y.Yeast?.Manufacturer,
                        ProductId = y.Yeast?.ProductId,
                        Type = y.Yeast?.Type,
                        Form = y.Yeast?.Form,
                        AttenuationMin = y.Yeast?.AttenuationMin,
                        AttenuationMax = y.Yeast?.AttenuationMax,
                        Amount = y.Amount,
                        Unit = y.Unit,
                        Attenuation = y.Attenuation,
                        TemperatureMin = y.TemperatureMin,
                        TemperatureMax = y.TemperatureMax
                    }),
                    Additives = recipe.Additives.Select(a => new
                    {
                        RecipeAdditiveId = a.RecipeAdditiveId,
                        AdditiveId = a.AdditiveId,
                        Name = a.Additive?.Name,
                        Category = a.Additive?.Category,
                        Type = a.Additive?.Type,
                        Amount = a.Amount,
                        Unit = a.Unit,
                        AdditionTime = a.AdditionTime,
                        AdditionStage = a.AdditionStage,
                        Purpose = a.Purpose,
                        TargetParameter = a.TargetParameter,
                        TargetValue = a.TargetValue,
                        SortOrder = a.SortOrder
                    }).OrderBy(a => a.AdditionTime).ThenBy(a => a.SortOrder),
                    Steps = recipe.Steps.Select(s => new
                    {
                        RecipeStepId = s.RecipeStepId,
                        StepNumber = s.StepNumber,
                        Phase = s.Phase,
                        StepName = s.StepName,
                        StepType = s.StepType,
                        Duration = s.Duration,
                        Temperature = s.Temperature,
                        TemperatureUnit = s.TemperatureUnit,
                        Amount = s.Amount,
                        AmountUnit = s.AmountUnit,
                        IngredientId = s.IngredientId,
                        IngredientType = s.IngredientType,
                        Description = s.Description,
                        Instructions = s.Instructions,
                        IsOptional = s.IsOptional,
                        AlertBefore = s.AlertBefore,
                        RequiresEquipment = s.RequiresEquipment,
                        EquipmentTypeId = s.EquipmentTypeId,
                        EquipmentTypeName = s.EquipmentType != null ? s.EquipmentType.Name : null,
                        EquipmentCapacityMin = s.EquipmentCapacityMin,
                        EquipmentCapacityUnit = s.EquipmentCapacityUnit
                    }).OrderBy(s => s.StepNumber).ToList()
                    // Commented out - RecipeMashStep table doesn't exist, using RecipeStep instead
                    /*
                    MashSteps = recipe.MashSteps.Select(m => new
                    {
                        MashStepId = m.MashStepId,
                        StepNumber = m.StepNumber,
                        StepName = m.StepName,
                        StepType = m.StepType,
                        Temperature = m.Temperature,
                        TemperatureUnit = m.TemperatureUnit,
                        Duration = m.Duration,
                        InfusionAmount = m.InfusionAmount,
                        InfusionTemp = m.InfusionTemp,
                        Description = m.Description
                    }).OrderBy(m => m.StepNumber)
                    */
                };

                return Ok(new { success = true, data = recipeData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recipe {RecipeId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // POST: api/recipes
        [HttpPost]
        public async Task<ActionResult> CreateRecipe([FromBody] CreateRecipeRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var tenantId = await GetUserTenantIdAsync();

                if (!currentUserId.HasValue || !tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                // Validate style exists if provided
                if (request.StyleId.HasValue)
                {
                    var styleExists = await _context.BJCPBeerStyles
                        .AnyAsync(s => s.StyleId == request.StyleId.Value);

                    if (!styleExists)
                    {
                        return BadRequest(new { success = false, message = "Invalid beer style selected" });
                    }
                }

                var recipe = new Recipe
                {
                    RecipeId = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    StyleId = request.StyleId,
                    Name = request.Name.Trim(),
                    Description = request.Description?.Trim(),
                    BatchSize = request.BatchSize,
                    BatchSizeUnit = request.BatchSizeUnit ?? "gallons",
                    BoilTime = request.BoilTime ?? 60,
                    Efficiency = request.Efficiency ?? 75.0m,
                    EstimatedOG = request.EstimatedOG,
                    EstimatedFG = request.EstimatedFG,
                    EstimatedABV = request.EstimatedABV,
                    EstimatedIBU = request.EstimatedIBU,
                    EstimatedSRM = request.EstimatedSRM,
                    Version = 1,
                    IsPublished = false,
                    IsActive = true,
                    Created = DateTime.UtcNow,
                    CreatedBy = currentUserId.Value,
                    Updated = DateTime.UtcNow,
                    UpdatedBy = currentUserId.Value
                };

                _context.Recipes.Add(recipe);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created recipe {RecipeId} for tenant {TenantId}",
                    recipe.RecipeId, tenantId.Value);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        recipeId = recipe.RecipeId,
                        name = recipe.Name,
                        batchSize = recipe.BatchSize,
                        version = recipe.Version
                    },
                    message = "Recipe created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating recipe");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // PUT: api/recipes/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateRecipe(Guid id, [FromBody] UpdateRecipeRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var tenantId = await GetUserTenantIdAsync();

                if (!currentUserId.HasValue || !tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var recipe = await _context.Recipes
                    .FirstOrDefaultAsync(r => r.RecipeId == id && r.TenantId == tenantId.Value);

                if (recipe == null)
                {
                    return NotFound(new { success = false, message = "Recipe not found" });
                }

                // Validate style exists if provided
                if (request.StyleId.HasValue)
                {
                    var styleExists = await _context.BJCPBeerStyles
                        .AnyAsync(s => s.StyleId == request.StyleId.Value);

                    if (!styleExists)
                    {
                        return BadRequest(new { success = false, message = "Invalid beer style selected" });
                    }
                }

                // Update properties
                recipe.StyleId = request.StyleId;
                recipe.Name = request.Name.Trim();
                recipe.Description = request.Description?.Trim();
                recipe.BatchSize = request.BatchSize;
                recipe.BatchSizeUnit = request.BatchSizeUnit ?? recipe.BatchSizeUnit;
                recipe.BoilTime = request.BoilTime ?? recipe.BoilTime;
                recipe.Efficiency = request.Efficiency ?? recipe.Efficiency;
                recipe.EstimatedOG = request.EstimatedOG;
                recipe.EstimatedFG = request.EstimatedFG;
                recipe.EstimatedABV = request.EstimatedABV;
                recipe.EstimatedIBU = request.EstimatedIBU;
                recipe.EstimatedSRM = request.EstimatedSRM;
                recipe.IsActive = request.IsActive ?? recipe.IsActive;
                recipe.Updated = DateTime.UtcNow;
                recipe.UpdatedBy = currentUserId.Value;

                // Handle ingredient updates
                await UpdateRecipeIngredientsAsync(recipe.RecipeId, request, currentUserId.Value, tenantId.Value);

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated recipe {RecipeId} for tenant {TenantId}",
                    recipe.RecipeId, tenantId.Value);

                return Ok(new { success = true, message = "Recipe updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating recipe {RecipeId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // DELETE: api/recipes/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRecipe(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var tenantId = await GetUserTenantIdAsync();

                if (!currentUserId.HasValue || !tenantId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Authentication required" });
                }

                await _context.Database.ExecuteSqlRawAsync($"SET app.tenant_id = '{tenantId.Value}'");

                var recipe = await _context.Recipes
                    .FirstOrDefaultAsync(r => r.RecipeId == id && r.TenantId == tenantId.Value);

                if (recipe == null)
                {
                    return NotFound(new { success = false, message = "Recipe not found" });
                }

                // Check if recipe has been used in brew sessions
                var hasBrewSessions = await _context.RecipeBrewSessions
                    .AnyAsync(rbs => rbs.RecipeId == id);

                if (hasBrewSessions)
                {
                    // Soft delete - mark as inactive instead of removing
                    recipe.IsActive = false;
                    recipe.Updated = DateTime.UtcNow;
                    recipe.UpdatedBy = currentUserId.Value;

                    await _context.SaveChangesAsync();

                    return Ok(new { success = true, message = "Recipe deactivated (has brew session history)" });
                }
                else
                {
                    // Hard delete if no references exist
                    _context.Recipes.Remove(recipe);
                    await _context.SaveChangesAsync();

                    return Ok(new { success = true, message = "Recipe deleted successfully" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting recipe {RecipeId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        private async Task UpdateRecipeIngredientsAsync(Guid recipeId, UpdateRecipeRequest request, Guid userId, Guid tenantId)
        {
            // Update Grains
            if (request.Grains != null)
            {
                // Remove existing grains
                var existingGrains = await _context.RecipeGrains
                    .Where(rg => rg.RecipeId == recipeId)
                    .ToListAsync();
                _context.RecipeGrains.RemoveRange(existingGrains);

                // Add new grains
                foreach (var grainRequest in request.Grains)
                {
                    var recipeGrain = new RecipeGrain
                    {
                        RecipeGrainId = Guid.NewGuid(),
                        RecipeId = recipeId,
                        GrainId = grainRequest.GrainId,
                        Amount = grainRequest.Amount,
                        Unit = grainRequest.Unit,
                        SortOrder = grainRequest.SortOrder,
                        Created = DateTime.UtcNow,
                        CreatedBy = userId,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = userId
                    };
                    _context.RecipeGrains.Add(recipeGrain);
                }
            }

            // Update Hops
            if (request.Hops != null)
            {
                var existingHops = await _context.RecipeHops
                    .Where(rh => rh.RecipeId == recipeId)
                    .ToListAsync();
                _context.RecipeHops.RemoveRange(existingHops);

                foreach (var hopRequest in request.Hops)
                {
                    var recipeHop = new RecipeHop
                    {
                        RecipeHopId = Guid.NewGuid(),
                        RecipeId = recipeId,
                        HopId = hopRequest.HopId,
                        Amount = hopRequest.Amount,
                        Unit = hopRequest.Unit,
                        AdditionTime = hopRequest.AdditionTime,
                        AdditionType = hopRequest.AdditionType ?? "boil",
                        Form = hopRequest.Form,
                        Created = DateTime.UtcNow,
                        CreatedBy = userId,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = userId
                    };
                    _context.RecipeHops.Add(recipeHop);
                }
            }

            // Update Yeasts
            if (request.Yeasts != null)
            {
                var existingYeasts = await _context.RecipeYeasts
                    .Where(ry => ry.RecipeId == recipeId)
                    .ToListAsync();
                _context.RecipeYeasts.RemoveRange(existingYeasts);

                foreach (var yeastRequest in request.Yeasts)
                {
                    var recipeYeast = new RecipeYeast
                    {
                        RecipeYeastId = Guid.NewGuid(),
                        RecipeId = recipeId,
                        YeastId = yeastRequest.YeastId,
                        Amount = yeastRequest.Amount,
                        Unit = yeastRequest.Unit,
                        YeastType = yeastRequest.YeastType,
                        Form = yeastRequest.Form,
                        Attenuation = yeastRequest.Attenuation,
                        TemperatureMin = yeastRequest.TemperatureMin,
                        TemperatureMax = yeastRequest.TemperatureMax,
                        Created = DateTime.UtcNow,
                        CreatedBy = userId,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = userId
                    };
                    _context.RecipeYeasts.Add(recipeYeast);
                }
            }

            // Update Additives
            if (request.Additives != null)
            {
                var existingAdditives = await _context.RecipeAdditives
                    .Where(ra => ra.RecipeId == recipeId)
                    .ToListAsync();
                _context.RecipeAdditives.RemoveRange(existingAdditives);

                foreach (var additiveRequest in request.Additives)
                {
                    var recipeAdditive = new RecipeAdditive
                    {
                        RecipeAdditiveId = Guid.NewGuid(),
                        RecipeId = recipeId,
                        AdditiveId = additiveRequest.AdditiveId,
                        Amount = additiveRequest.Amount,
                        Unit = additiveRequest.Unit,
                        AdditionTime = additiveRequest.AdditionTime,
                        AdditionStage = additiveRequest.AdditionStage,
                        Purpose = additiveRequest.Purpose,
                        TargetParameter = additiveRequest.TargetParameter,
                        TargetValue = additiveRequest.TargetValue,
                        SortOrder = additiveRequest.SortOrder,
                        Created = DateTime.UtcNow,
                        CreatedBy = userId,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = userId
                    };
                    _context.RecipeAdditives.Add(recipeAdditive);
                }
            }

            // Update Recipe Steps
            if (request.Steps != null)
            {
                var existingSteps = await _context.RecipeSteps
                    .Where(rs => rs.RecipeId == recipeId)
                    .ToListAsync();
                _context.RecipeSteps.RemoveRange(existingSteps);

                foreach (var stepRequest in request.Steps)
                {
                    var recipeStep = new RecipeStep
                    {
                        RecipeStepId = Guid.NewGuid(),
                        RecipeId = recipeId,
                        StepNumber = stepRequest.StepNumber,
                        Phase = stepRequest.Phase.Trim(),
                        StepName = stepRequest.StepName.Trim(),
                        StepType = stepRequest.StepType?.Trim(),
                        Duration = stepRequest.Duration,
                        Temperature = stepRequest.Temperature,
                        TemperatureUnit = stepRequest.TemperatureUnit ?? "°F",
                        Amount = stepRequest.Amount,
                        AmountUnit = stepRequest.AmountUnit?.Trim(),
                        IngredientId = stepRequest.IngredientId,
                        IngredientType = stepRequest.IngredientType?.Trim(),
                        Description = stepRequest.Description?.Trim(),
                        Instructions = stepRequest.Instructions?.Trim(),
                        IsOptional = stepRequest.IsOptional,
                        AlertBefore = stepRequest.AlertBefore,
                        Created = DateTime.UtcNow,
                        CreatedBy = userId,
                        Updated = DateTime.UtcNow,
                        UpdatedBy = userId
                    };
                    _context.RecipeSteps.Add(recipeStep);
                }
            }

            // Commented out - RecipeMashStep table doesn't exist, using RecipeStep instead
            /*
            // Update Mash Steps
            if (request.MashSteps != null)
            {
                // Use direct SQL to delete existing mash steps to avoid constraint issues
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM public.\"RecipeMashStep\" WHERE \"RecipeId\" = {0}",
                    recipeId);

                // Auto-assign sequential step numbers starting from 1
                for (int i = 0; i < request.MashSteps.Count; i++)
                {
                    request.MashSteps[i].StepNumber = i + 1;
                }

                // Now add the new mash steps
                foreach (var mashStepRequest in request.MashSteps)
                {
                    // Ensure StepName and StepType are not empty/null for better data integrity
                    var stepName = string.IsNullOrWhiteSpace(mashStepRequest.StepName)
                        ? null
                        : mashStepRequest.StepName.Trim();

                    var stepType = string.IsNullOrWhiteSpace(mashStepRequest.StepType)
                        ? null
                        : mashStepRequest.StepType.Trim();

                    // Log the values being saved for debugging
                    _logger.LogInformation("Saving mash step {StepNumber} - StepName: '{StepName}', StepType: '{StepType}'",
                        mashStepRequest.StepNumber, stepName ?? "NULL", stepType ?? "NULL");

                    var recipeMashStep = new RecipeMashStep
                    {
                        MashStepId = Guid.NewGuid(),
                        RecipeId = recipeId,
                        StepNumber = mashStepRequest.StepNumber,
                        StepName = stepName,
                        StepType = stepType,
                        Temperature = mashStepRequest.Temperature,
                        TemperatureUnit = mashStepRequest.TemperatureUnit ?? "F",
                        Duration = mashStepRequest.Duration,
                        InfusionAmount = mashStepRequest.InfusionAmount,
                        InfusionTemp = mashStepRequest.InfusionTemp,
                        Description = mashStepRequest.Description?.Trim(),
                        Created = DateTime.UtcNow
                    };
                    _context.RecipeMashSteps.Add(recipeMashStep);
                }
            }
            */
        }
    }

    // DTOs for Recipes
    public class CreateRecipeRequest
    {
        public Guid? StyleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal BatchSize { get; set; }
        public string? BatchSizeUnit { get; set; }
        public int? BoilTime { get; set; }
        public decimal? Efficiency { get; set; }
        public decimal? EstimatedOG { get; set; }
        public decimal? EstimatedFG { get; set; }
        public decimal? EstimatedABV { get; set; }
        public decimal? EstimatedIBU { get; set; }
        public decimal? EstimatedSRM { get; set; }
    }

    public class UpdateRecipeRequest
    {
        public Guid? StyleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal BatchSize { get; set; }
        public string? BatchSizeUnit { get; set; }
        public int? BoilTime { get; set; }
        public decimal? Efficiency { get; set; }
        public decimal? EstimatedOG { get; set; }
        public decimal? EstimatedFG { get; set; }
        public decimal? EstimatedABV { get; set; }
        public decimal? EstimatedIBU { get; set; }
        public decimal? EstimatedSRM { get; set; }
        public bool? IsActive { get; set; }

        // Ingredient collections
        public List<RecipeGrainRequest>? Grains { get; set; }
        public List<RecipeHopRequest>? Hops { get; set; }
        public List<RecipeYeastRequest>? Yeasts { get; set; }
        public List<RecipeAdditiveRequest>? Additives { get; set; }
        public List<RecipeStepRequest>? Steps { get; set; }
        // Commented out - RecipeMashStep table doesn't exist, using RecipeStep instead
        // public List<RecipeMashStepRequest>? MashSteps { get; set; }
    }

    // Ingredient DTOs
    public class RecipeGrainRequest
    {
        [JsonPropertyName("recipeGrainId")]
        public Guid? RecipeGrainId { get; set; }

        [JsonPropertyName("grainId")]
        public Guid GrainId { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "lbs";

        [JsonPropertyName("percentage")]
        public decimal? Percentage { get; set; }

        [JsonPropertyName("lovibond")]
        public decimal? Lovibond { get; set; }

        [JsonPropertyName("extractPotential")]
        public decimal? ExtractPotential { get; set; }

        [JsonPropertyName("mustMash")]
        public bool? MustMash { get; set; }

        [JsonPropertyName("sortOrder")]
        public int? SortOrder { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }

    public class RecipeHopRequest
    {
        [JsonPropertyName("recipeHopId")]
        public Guid? RecipeHopId { get; set; }

        [JsonPropertyName("hopId")]
        public Guid HopId { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "oz";

        [JsonPropertyName("additionTime")]
        public int AdditionTime { get; set; }

        [JsonPropertyName("additionType")]
        public string AdditionType { get; set; } = "Boil";

        [JsonPropertyName("purpose")]
        public string? Purpose { get; set; }

        [JsonPropertyName("form")]
        public string? Form { get; set; }

        [JsonPropertyName("alphaAcid")]
        public decimal? AlphaAcid { get; set; }
    }

    public class RecipeYeastRequest
    {
        [JsonPropertyName("recipeYeastId")]
        public Guid? RecipeYeastId { get; set; }

        [JsonPropertyName("yeastId")]
        public Guid YeastId { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "pkg";

        [JsonPropertyName("yeastType")]
        public string? YeastType { get; set; }

        [JsonPropertyName("form")]
        public string? Form { get; set; }

        [JsonPropertyName("attenuation")]
        public decimal? Attenuation { get; set; }

        [JsonPropertyName("temperatureMin")]
        public decimal? TemperatureMin { get; set; }

        [JsonPropertyName("temperatureMax")]
        public decimal? TemperatureMax { get; set; }
    }

    public class RecipeAdditiveRequest
    {
        [JsonPropertyName("recipeAdditiveId")]
        public Guid? RecipeAdditiveId { get; set; }

        [JsonPropertyName("additiveId")]
        public Guid AdditiveId { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "oz";

        [JsonPropertyName("additionTime")]
        public int? AdditionTime { get; set; }

        [JsonPropertyName("additionStage")]
        public string? AdditionStage { get; set; }

        [JsonPropertyName("purpose")]
        public string? Purpose { get; set; }

        [JsonPropertyName("targetParameter")]
        public string? TargetParameter { get; set; }

        [JsonPropertyName("targetValue")]
        public decimal? TargetValue { get; set; }

        [JsonPropertyName("sortOrder")]
        public int? SortOrder { get; set; }
    }

    public class RecipeMashStepRequest
    {
        [JsonPropertyName("mashStepId")]
        public Guid? MashStepId { get; set; }

        [JsonPropertyName("stepNumber")]
        public int StepNumber { get; set; }

        [JsonPropertyName("stepName")]
        public string StepName { get; set; } = string.Empty;

        [JsonPropertyName("stepType")]
        public string? StepType { get; set; }

        [JsonPropertyName("temperature")]
        public decimal Temperature { get; set; }

        [JsonPropertyName("temperatureUnit")]
        public string? TemperatureUnit { get; set; } = "F";

        [JsonPropertyName("duration")]
        public int Duration { get; set; }

        [JsonPropertyName("infusionAmount")]
        public decimal? InfusionAmount { get; set; }

        [JsonPropertyName("infusionTemp")]
        public decimal? InfusionTemp { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    public class RecipeStepRequest
    {
        [JsonPropertyName("recipeStepId")]
        public Guid? RecipeStepId { get; set; }

        [JsonPropertyName("stepNumber")]
        public int StepNumber { get; set; }

        [JsonPropertyName("phase")]
        public string Phase { get; set; } = string.Empty; // Mash, Boil, Fermentation, Conditioning, Packaging

        [JsonPropertyName("stepName")]
        public string StepName { get; set; } = string.Empty;

        [JsonPropertyName("stepType")]
        public string? StepType { get; set; }

        [JsonPropertyName("duration")]
        public int? Duration { get; set; }

        [JsonPropertyName("temperature")]
        public decimal? Temperature { get; set; }

        [JsonPropertyName("temperatureUnit")]
        public string? TemperatureUnit { get; set; } = "°F";

        [JsonPropertyName("amount")]
        public decimal? Amount { get; set; }

        [JsonPropertyName("amountUnit")]
        public string? AmountUnit { get; set; }

        [JsonPropertyName("ingredientId")]
        public Guid? IngredientId { get; set; }

        [JsonPropertyName("ingredientType")]
        public string? IngredientType { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("instructions")]
        public string? Instructions { get; set; }

        [JsonPropertyName("isOptional")]
        public bool IsOptional { get; set; } = false;

        [JsonPropertyName("alertBefore")]
        public int? AlertBefore { get; set; }
    }
}