Instruction on Examcopedia
======

The main app is a `node` app with a `mysql` database.

You can checkout the repository here:

```
https://github.com/xgui3783/examcopedia
```

You will want to use the branch `without_email_confirmation`. 

If you want to set it up manually, you will need to do the following:

- set up VM, install & run mysql, install node (> v6)
- setup the following environmental variables: DB_HOST, MYSQL_DB_USERNAME, MYSQL_DB_PASSWORD
- in the root directory, type `node server.js`

Alternatively, if you have docker and docker-compose configured, you can download/save the following script:

```
version: '2'

services:
  app:
    image: xgui3783/examcopedia:no_email_verification
    depends_on:
      - mysql
    volumes :
      - ${PWD}/config.js:/examcopedia/public/include/config.js
      - ${PWD}/data/img:/examcopedia/public/img
    ports:
      - 80:3002
    environment:
      - DB_HOST=mysql
      - MYSQL_DB_USERNAME=root
      - MYSQL_DB_PASSWORD=SOMETHINGRANDOMPASSWORD_IS_A_JELLYFISH_
  mysql:
    image: mysql:5
    environment:
      - MYSQL_ROOT_PASSWORD=SOMETHINGRANDOMPASSWORD_IS_A_JELLYFISH_
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    depends_on:
      - mysql
    ports:
      - 127.0.0.1:81:80
    environment:
      - MYSQL_ROOT_PASSWORD=SOMETHINGRANDOMPASSWORD_IS_A_JELLYFISH_
      - PMA_HOST=mysql

```

then type:

`docker-compose up`

and it should work out of the box. I may have to make some adjustments to `xgui3783/examcopedia:no_email_verification`, that will happen next weekend. 
