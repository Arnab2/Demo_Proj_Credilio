import Route from "@ioc:Adonis/Core/Route";

Route.group(() => {
  Route.post("", "UserController.createProfile");
  Route.get("", "UserController.viewProfile");
  Route.patch("", "UserController.updateProfile");
  Route.delete("", "UserController.deleteProfile");
})
  .prefix("profile")
  .middleware("auth");

Route.post("register", "UserController.register");

Route.post("login", "UserController.login");

Route.post("logout", "UserController.logout");
