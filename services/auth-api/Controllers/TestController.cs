using Microsoft.AspNetCore.Mvc;

namespace Fermentum.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("debug")]
    public ActionResult<string> Debug()
    {
        return Ok("TestController is working!");
    }
}