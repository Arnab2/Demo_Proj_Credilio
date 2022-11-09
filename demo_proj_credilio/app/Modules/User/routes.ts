import Route from '@ioc:Adonis/Core/Route'


Route.post('register','UserController.register')

Route.post('profile', 'UserController.createProfile')

Route.get('profile','UserController.viewProfile')

Route.patch('profile','UserController.updateProfile')

Route.delete('profile','UserController.deleteProfile')

Route.post('login','UserController.login')

Route.post('logout','UserController.logout')

Route.get('dashboard', async ({ auth }) => {
    const obj = await auth.use('api').authenticate() 
    console.log(obj.$original)
    return "tested"
  })