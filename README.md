# SHADEBOOK
With Shadebook you can create a structured collection of all your work in a proper hierarchical order according to its significance. We help you get an upper hand in presenting your content in a proper digital profile which consists of images and videos.

We personally take efforts by helping you in design and customise every aspect of your profile according to your requirements. We provide technological as well as marketing and sales tools to refine and develop your profile and make it look as professional.

![homepage](screenshots/shadebook_home.jpg)


# QUICK GUIDE/STEPS TO RUN THE PROJECT:
  
  1. Clone the project.
	2. Download and install NodeJs in your environment.
	3. Run "npm install" command by traversing to all 3 subfolders present inside the SHADEBOOK folder to install related packages and dependencies.
	4. Download and install MongoDB Database [MongoDB Community Server]
	5. Add new entry to system environment variable [ PATH ] for MongoDb
        [ Ex :  C:\Program Files\MongoDB\Server\5.0\bin ]
	6. Run the mongodb daemon [ >> mongod ] 
	7. Create directory as below
		    C:\data\db\  => Databases will be stored here. [ >> mkdir C:\data\db ]
	8. Download and install "Robo 3T" [ MongoDB GUI client ]
	9. Now open Robo3T and create new connection and connect.
	10. Install nodemon package
		    >>npm install -g nodemon
		
	
# SHADEBOOK HOME[ Runs on Port 4000 ]:

Run this project : >> nodemon server.js
		a) This is the platform where you can search for other user public profiles and view it.
		b) You can use the contact us page.
			[ Collection will look like below for "contacts" ]
		  ![contacts](screenshots/contacts_collection.jpg)	
		c) Login/Register will internally take you to port:3000[shadebook account]
    
# SHADEBOOK ACCOUNT [ Runs on Port 3000 ]:

Run this project : >>nodemon server.js
		a) Actual Login/Registration of user happens on this platform
		b) This is where the user will create his own digital profile.
		c) The "users collection" has the structure like below:
    ![users](screenshots/users_collection.jpg)
		d) You need to add one themes database also so that the themes section will appear , else it will be blank by default. Database structure is like below:
    ![themes](screenshots/themes_collection.jpg)
		
		
		
# SHADEBOOK ADMIN [ Runs on Port 5000 ]:

Run this project : >>nodemon server.js
	a)This portal is only for administrative purpose.
  b)All users,contacts,themes,etc will be managed from here.
