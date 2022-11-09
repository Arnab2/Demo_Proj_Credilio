import Route from '@ioc:Adonis/Core/Route'


Route.post('register','UserController.register')

Route.post('profile', 'UserController.createProfile')

Route.get('profile','UserController.viewProfile')

Route.patch('profile','UserController.updateProfile')

Route.delete('profile','UserController.deleteProfile')
