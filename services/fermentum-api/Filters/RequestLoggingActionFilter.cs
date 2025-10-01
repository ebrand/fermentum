using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Text;

namespace Fermentum.Auth.Filters
{
    public class RequestLoggingActionFilter : IActionFilter, IResultFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<RequestLoggingActionFilter>>();

            logger.LogInformation("🔍 [REQUEST DEBUG] Action executing: {Controller}.{Action}",
                context.ActionDescriptor.RouteValues["controller"],
                context.ActionDescriptor.RouteValues["action"]);

            logger.LogInformation("🔍 [REQUEST DEBUG] Route values: {@RouteValues}", context.ActionDescriptor.RouteValues);
            logger.LogInformation("🔍 [REQUEST DEBUG] Action arguments: {@Arguments}", context.ActionArguments);
            logger.LogInformation("🔍 [REQUEST DEBUG] Request path: {Path}", context.HttpContext.Request.Path);
            logger.LogInformation("🔍 [REQUEST DEBUG] Request method: {Method}", context.HttpContext.Request.Method);
            logger.LogInformation("🔍 [REQUEST DEBUG] Content type: {ContentType}", context.HttpContext.Request.ContentType);
            logger.LogInformation("🔍 [REQUEST DEBUG] Content length: {ContentLength}", context.HttpContext.Request.ContentLength);

            // Log model state if there are errors
            if (!context.ModelState.IsValid)
            {
                logger.LogWarning("🔍 [REQUEST DEBUG] Model state is INVALID:");
                foreach (var modelError in context.ModelState)
                {
                    foreach (var error in modelError.Value.Errors)
                    {
                        logger.LogWarning("🔍 [REQUEST DEBUG] Model error - {Key}: {Error}", modelError.Key, error.ErrorMessage);
                    }
                }
            }
            else
            {
                logger.LogInformation("🔍 [REQUEST DEBUG] Model state is valid");
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<RequestLoggingActionFilter>>();

            if (context.Exception != null)
            {
                logger.LogError(context.Exception, "🔍 [REQUEST DEBUG] Action threw exception: {Controller}.{Action}",
                    context.ActionDescriptor.RouteValues["controller"],
                    context.ActionDescriptor.RouteValues["action"]);
            }
            else
            {
                logger.LogInformation("🔍 [REQUEST DEBUG] Action executed successfully: {Controller}.{Action}",
                    context.ActionDescriptor.RouteValues["controller"],
                    context.ActionDescriptor.RouteValues["action"]);
            }
        }

        public void OnResultExecuting(ResultExecutingContext context)
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<RequestLoggingActionFilter>>();
            logger.LogInformation("🔍 [REQUEST DEBUG] Result executing - Type: {ResultType}", context.Result.GetType().Name);

            if (context.Result is BadRequestObjectResult badRequest)
            {
                logger.LogWarning("🔍 [REQUEST DEBUG] BadRequest result: {@Value}", badRequest.Value);
            }
            else if (context.Result is BadRequestResult)
            {
                logger.LogWarning("🔍 [REQUEST DEBUG] BadRequest result (no value)");
            }
        }

        public void OnResultExecuted(ResultExecutedContext context)
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<RequestLoggingActionFilter>>();
            logger.LogInformation("🔍 [REQUEST DEBUG] Result executed - Status: {StatusCode}",
                context.HttpContext.Response.StatusCode);
        }
    }
}