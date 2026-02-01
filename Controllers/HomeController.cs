using Microsoft.AspNetCore.Mvc;

namespace RetroRacer.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
