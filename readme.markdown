CodeIgniter Active Record for Node
==================================

I come from a PHP/CodeIgniter background, so when playing around with node, I wondered if there was a "sql writer" out there. Poked around and couldn't find any so I wrote one that acts exactly like CodeIgniters way. This probably is the wrong way in the javascript world, but what the hay!

CodeIgniters' Active Record documentation can be found [here](http://codeigniter.com/user_guide/database/active_record.html). This library will act very similar.

Examples:
---------

    var Ciar = require("./lib/ciar"),
        Sql = new Ciar;

    console.log (Sql.get("powpow").sql());

Will ouput:

    SELECT *
    FROM powpow

Most of the members on the class are chainable, which means you can do fancy stuff like:

    console.log(
      Sql.select("whammy")
         .where("name", "derek")
         .from("derek")
         .limit(10)
         .order_by("age")
         .sql() );

Producing:

    SELECT whammy
    FROM derek
    WHERE (name = 'derek') 
    ORDER BY age ASC
    LIMIT 10


*Note that you can call the methods out of order but still produce a correct query.*

### Easy CoffeeScript compile:
    coffee -bc ciar.coffee

Todo:
-----

* There are still a few additions that I need to make (like updating, inserting and deleting sql writing)
* Write tests
