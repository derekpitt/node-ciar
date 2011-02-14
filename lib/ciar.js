// a CI style chainable object that has one purpose: make generating sql statements in code more readable.
// by derek pittsinger




// some utulity functions




// this is taken directly from the node-mysql project by: felixge (https://github.com/felixge/node-mysql/blob/master/lib/mysql/client.js)
function ciar_escape(val)
{
	if (val === undefined || val === null) 
	{
		return 'NULL';
	}

  	switch (typeof val) {
    		case 'boolean': return (val) ? 'true' : 'false';
    		case 'number': return val+'';
  	}

  	val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    		switch(s) {
      			case "\0": return "\\0";
      			case "\n": return "\\n";
      			case "\r": return "\\r";
      			case "\b": return "\\b";
      			case "\t": return "\\t";
      			case "\x1a": return "\\Z";
      			default: return "\\"+s;
    		}
  	});
  	return val;
}




var ciar = function ()
{
	this.debug = false;

	this.select_items = [];
	this.from_items = [];
	this.where_items = [];
	this.orderby_items = [];
	this.join_items = [];
	this.groupby_items = [];

	this.has_distinct = false;

	this.limit_offset = null;
	this.limit_numRecords = null;



	this.select = function(select)
	{
		this.select_items[this.select_items.length] = select;

		if (this.debug)
			console.log(select);

		return this;
	}

	this.distinct = function()
	{
		this.has_distinct = true;
		return this;
	}

	this.from = function(from)
	{
		this.from_items[this.from_items.length] = from;

		if (this.debug)
			console.log(from);

		return this;
	}


	this.where = function(key, value, prefix_type)
	{
		if (prefix_type == null)
			prefix_type = "and";
		
		
		
		
		// need to see if it is an array, and make some recursive calls
		if (typeof(key) == 'object' && key.length)
		{
			if (this.debug)
				console.log("parameter is an array, pow pow!");

			for (i in key)
				this.where(key[i][0], key[i][1], prefix_type);

			return this;
		}


		var op = "=";

		key = key.trim();

		// todo: refactor
		// this I really need to refactor!!!
		if (key.substr(key.length - 1, 1) == "=")
		{
			op = "=";
			key = key.substr(0, key.length - 2).trim();
		}
		if (key.substr(key.length - 1, 1) == ">")
		{
			op = ">";
			key = key.substr(0, key.length - 2).trim();
		}
		if (key.substr(key.length - 2, 2) == ">=")
		{
			op = ">=";
			key = key.substr(0, key.length - 2).trim();
		}
		if (key.substr(key.length - 1, 1) == "<")
		{
			op = "<";
			key = key.substr(0, key.length - 2).trim();
		}
		if (key.substr(key.length - 2, 2) == "<=")
		{
			op = "<=";
			key = key.substr(0, key.length - 2).trim();
		}


		if (key.substr(key.length - 3, 3) == " IN")
		{
			op = "IN";
			key = key.substr(0, key.length - 3).trim();
		}
		if (key.substr(key.length - 7, 7) == " NOT IN")
		{
			op = "NOT IN";
			key = key.substr(0, key.length - 7).trim();
		}



		this.where_items[this.where_items.length] =
			 [key + " " + op, value, prefix_type];


		return this;
	}



	// where in
	this.where_in = function(column, arrayOfItems)
	{
		return this.where(column + " IN", arrayOfItems)
	}
	this.where_not_in = function(column, arrayOfItems)
	{
		return this.where(column + " NOT IN", arrayOfItems)
	}

	// or where in
	this.or_where_in = function(column, arrayOfItems)
	{
		return this.where(column + " IN", arrayOfItems, "OR")
	}
	this.or_where_not_in = function(column, arrayOfItems)
	{
		return this.where(column + " NOT IN", arrayOfItems, "OR")
	}


	// todo: finish this one.
	// order_by
	
	this.order_by = function(column, direction)
	{

		if (direction != null)
		{
			if (direction.toUpperCase() == "DESC")
			{
				this.orderby_items[this.orderby_items.length] = 
					[ column, "DESC" ];
			}
			else
			{
				this.orderby_items[this.orderby_items.length] = 
					[ column, "ASC" ];
			}
		}
		else
		{
			// todo: need to test the last token of the string for a direction...
			

			// if there is no valid direction, default to asc
			this.orderby_items[this.orderby_items.length] = 
				[ column, "ASC" ];
		}
		return this;
	}


	this.group_by = function(column)
	{
		if (typeof(column) == 'object' && column.length)
		{
			for (i in column)
			{
				this.group_by(column[i]);
			}
		}
		else
		{
			this.groupby_items[this.groupby_items.length] = column;
		}

		return this;
	}

	this.limit = function(numRows, offset)
	{
		if (numRows != null)
			this.limit_numRecords = numRows;

		if (offset != null)
			this.limit_offset = offset;

		return this;
	}


	// get function, this will act like the from
	

	this.get = function(table, numRows, offset)
	{
		if (table != null)
		{
			// need to check if numRows is set
			if (numRows != null)
				this.limit(numRows, offset);
		
		
			return this.from(table);

		}
		else
		{
			// what should we do here??

		}

	}




	// join 
	//
	
	this.join = function(table, comparer, joinType)
	{
		if (table != null && comparer != null)
		{
			if (joinType == null)
				joinType = "";

			this.join_items[this.join_items.length] = 
				[ table, comparer, joinType ];


		}
		return this;

	}




	// some helper functions for where...
	this.or_where = function(key, value)
	{
		return this.where(key, value, "or");
	}




	


	this.sql = function()
	{
		// this is what builds the statement





		// first the select
		var selectStatement = "SELECT ";


		if (this.has_distinct)
		{
			selectStatement += "DISTINCT ";
		}

		if (this.select_items.length == 0)
			selectStatement += "*";
		else
		{
			for (i in this.select_items)
				selectStatement += this.select_items[i] + ", ";


			selectStatement = selectStatement.substr(0, selectStatement.length - 2);
		}


		// then the from
		var fromStatement = "FROM ";
		if (this.from_items.length == 0)
		{
			// well crap
		}
		else
		{
			for (i in this.from_items)
				fromStatement += this.from_items[i] + ", ";


			fromStatement = fromStatement.substr(0, fromStatement.length - 2);
			
		}



		// the join
		var joinStatement = "";
		if (this.join_items.length > 0)
		{
			for (i in this.join_items)
			{
				joinStatement += this.join_items[i][2] + " JOIN " + this.join_items[i][0] + " ON " + this.join_items[i][1] + " ";
			}


		}






		if (this.debug)
			console.log(this.where_items);
		var whereStatement = "";

		if (this.where_items.length > 0)
		{
			var first = true;
			whereStatement = "WHERE ";

			for (i in this.where_items)
			{
				var formatValue = "";


				// need to decide if we have a where in
				if (typeof(this.where_items[i][1]) == 'object' && this.where_items[i][1].length)
				{
					// we are probably in a where in

					formatValue = "(";

					var itemFirst = true;
					for (x in this.where_items[i][1])
					{
						if (itemFirst)
							itemFirst = false;
						else
							formatValue += ", ";

						formatValue += "'" + ciar_escape(this.where_items[i][1][x]) + "'";

					}

					formatValue += ")";

				}
				else
				{
					formatValue = "'" + ciar_escape(this.where_items[i][1]) + "'";
				}










				if (first)
				{
					whereStatement += "(" + this.where_items[i][0] + " " +
								formatValue + ") ";

					first = false;
				}
				else
				{
					whereStatement += this.where_items[i][2] + " (" + this.where_items[i][0] + " " +
											  formatValue + ") ";
				}
			}
		}





		// groupby stuff
		//
		var groupbyStatement = "";


		if (this.groupby_items.length > 0)
		{
			groupbyStatement = "GROUP BY ";
			
			for (i in this.groupby_items)
				groupbyStatement += this.groupby_items[i] + ", ";


			groupbyStatement = groupbyStatement.substr(0, groupbyStatement.length - 2);
		}






		// orderby stuff
		

		var orderbyStatement = "";
		if (this.orderby_items.length > 0)
		{
			orderbyStatement = "ORDER BY ";
			var first = true;

			for (i in this.orderby_items)
			{
				if (first)
				{
					orderbyStatement += this.orderby_items[i][0] + " " + this.orderby_items[i][1];
					first = false;
				}
				else
				{
					orderbyStatement += ", " + this.orderby_items[i][0] + " " + this.orderby_items[i][1];
				}
			}
		}





		// limit stuff

		var limitStatement = "";

		if (this.limit_numRecords != null)
		{
			limitStatement = "LIMIT " + this.limit_numRecords;

			if (this.limit_offset != null)
			{
				limitStatement = "LIMIT " + this.limit_offset + ", " + this.limit_numRecords;
			}
		}


	


		

		var returnSql = "";
		if (selectStatement != "")
			returnSql += selectStatement;

		if (fromStatement != "")
			returnSql += "\n" + fromStatement;
		
		if (joinStatement != "")
			returnSql += "\n" + joinStatement;

		if (whereStatement != "")
			returnSql += "\n" + whereStatement;
		
		if (groupbyStatement != "")
			returnSql += "\n" + groupbyStatement;
		
		if (orderbyStatement != "")
			returnSql += "\n" + orderbyStatement;
		
		if (limitStatement != "")
			returnSql += "\n" + limitStatement;

		return returnSql;
	}
}


module.exports = ciar;

