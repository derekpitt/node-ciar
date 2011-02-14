// This is a quick test of some of the features of node-ciar.
// By: Derek Pittsinger






var Ciar = require("./lib/ciar"),
    query = new Ciar();







console.log(
	query.select("user_id")
	     .from("users")
	     .where("first_name", "derek")
	     .where("first_name =", "derek")
	     .where("first_name >", "derek")
	     .where("first_name <", "derek")
	     .where("first_name >=", "derek")
	     .where("first_name <=", "derek")
	     .where_not_in("first_name", ["derek", "derek2"])
             .order_by("last_name")
	     .sql()

);


