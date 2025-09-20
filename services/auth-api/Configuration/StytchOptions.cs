namespace Fermentum.Auth.Configuration;

public class StytchOptions
{
    public string ProjectId { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public string Environment { get; set; } = "test"; // test, live
}

public class JwtOptions
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 60;
}