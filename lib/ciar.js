/*
These "monkey patch" the string class and add a few helper methods that I take advantage of
*/var Ciar;
String.prototype.endsWith = function(str) {
  if (this.substr(this.length - str.length, str.length) === str) {
    return true;
  } else {
    return false;
  }
};
String.prototype.takeEndOff = function(str) {
  return this.substr(0, this.length - str.length).trim();
};
/*
Alright, Alright!
The good stuff, man building classes in coffee is WAAAAAY better than in plain ol javascript.
*/
Ciar = (function() {
  /*
    Just a quick setup of some vars that i use throught the instance of this class
    */  function Ciar() {
    this.select_items = [];
    this.from_items = [];
    this.where_items = [];
    this.orderby_items = [];
    this.groupby_items = [];
    this.join_items = [];
    this.has_distinct = false;
    this.limit_num_rows = null;
    this.limit_offset = null;
  }
  /*
    Got this function from felixge (https://github.com/felixge/node-mysql/blob/master/lib/mysql/client.js)
    But converted it to coffee
    */
  Ciar.prototype.escape = function(val) {
    if (!(val != null) || val === void 0) {
      return 'NULL';
    }
    switch (typeof val) {
      case 'boolean':
        if (val) {
          return 'true';
        } else {
          return 'false';
        }
      case 'number':
        return val + '';
    }
    return val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
      switch (s) {
        case "\0":
          return "\\0";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case "\b":
          return "\\b";
        case "\t":
          return "\\t";
        case "\x1a":
          return "\\Z";
        default:
          return "\\" + s;
      }
    });
  };
  Ciar.prototype.select = function(select) {
    this.select_items.push(select);
    return this;
  };
  Ciar.prototype.distinct = function() {
    this.has_distinct = true;
    return this;
  };
  Ciar.prototype.from = function(from) {
    this.from_items.push(from);
    return this;
  };
  Ciar.prototype.where = function(key, value, prefix) {
    var i, op, _i, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    if (!(prefix != null)) {
      prefix = "AND";
    }
    if (typeof key === 'object' && key.length) {
      for (_i = 0, _len = key.length; _i < _len; _i++) {
        i = key[_i];
        this.where(i[0], i[1], prefix);
      }
      return this;
    }
    op = "=";
    key = key.trim();
    if (key.endsWith(" NOT IN")) {
      _ref = ["NOT IN", key.takeEndOff(" NOT IN")], op = _ref[0], key = _ref[1];
    } else if (key.endsWith(" IN")) {
      _ref2 = ["IN", key.takeEndOff(" IN")], op = _ref2[0], key = _ref2[1];
    } else if (key.endsWith(">=")) {
      _ref3 = [">=", key.takeEndOff(">=")], op = _ref3[0], key = _ref3[1];
    } else if (key.endsWith("<=")) {
      _ref4 = ["<=", key.takeEndOff("<=")], op = _ref4[0], key = _ref4[1];
    } else if (key.endsWith("=")) {
      _ref5 = ["=", key.takeEndOff("=")], op = _ref5[0], key = _ref5[1];
    } else if (key.endsWith(">")) {
      _ref6 = [">", key.takeEndOff(">")], op = _ref6[0], key = _ref6[1];
    } else if (key.endsWith("<")) {
      _ref7 = ["<", key.takeEndOff("<")], op = _ref7[0], key = _ref7[1];
    }
    this.where_items.push([key + " " + op, value, prefix]);
    return this;
  };
  Ciar.prototype.or_where = function(key, value) {
    return this.where(key, value, "OR");
  };
  Ciar.prototype.where_in = function(column, items) {
    return this.where(column + " IN", items);
  };
  Ciar.prototype.where_not_in = function(column, items) {
    return this.where(column + " NOT IN", items);
  };
  Ciar.prototype.or_where_in = function(column, items) {
    return this.where(column + " IN", items, "OR");
  };
  Ciar.prototype.or_where_not_in = function(column, items) {
    return this.where(column + " NOT IN", items, "OR");
  };
  Ciar.prototype.order_by = function(column, direction) {
    if (!(direction != null)) {
      this.orderby_items.push([column, "ASC"]);
    } else {
      direction = "ASC";
      if (direction.toUpperCase() === "DESC") {
        direction = "DESC";
      }
      this.orcerby_items.push([column, direction]);
    }
    return this;
  };
  Ciar.prototype.group_by = function(column) {
    var i, _i, _len;
    if (typeof column === 'object' && column.length) {
      for (_i = 0, _len = column.length; _i < _len; _i++) {
        i = column[_i];
        this.group_by(i);
      }
    } else {
      this.groupby_items.push(column);
    }
    return this;
  };
  Ciar.prototype.limit = function(num_rows, offset) {
    if (num_rows != null) {
      this.limit_num_rows = num_rows;
    }
    if (offset != null) {
      this.limit_offset = offset;
    }
    return this;
  };
  Ciar.prototype.get = function(table, num_rows, offset) {
    if (table != null) {
      if (num_rows != null) {
        this.limit(num_rows, offset);
      }
      return this.from(table);
    }
  };
  Ciar.prototype.join = function(table, comparer, join_type) {
    if ((table != null) && (comparer != null)) {
      if (!(join_type != null)) {
        join_type = "";
      }
      this.join_items.push([table, comparer, join_type]);
    }
    return this;
  };
  /*
    this is going to be a big one...  wonder if i need to break it up or put it in another class????
    */
  Ciar.prototype.sql = function() {
    /*
        The select statement
        */    var first, format_value, fromStatement, groupByStatement, i, joinStatement, limitStatement, orderByStatement, returnSql, selectStatement, whereStatement, x, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    selectStatement = "SELECT ";
    if (this.has_distinct) {
      selectStatement += "DISTINCT ";
    }
    if (this.select_items.length === 0) {
      selectStatement += "*";
    } else {
      _ref = this.select_items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        selectStatement += i + ", ";
      }
      selectStatement = selectStatement.takeEndOff(", ");
    }
    /*
        The From Statement
        */
    fromStatement = "FROM ";
    if (this.from_items.length > 0) {
      _ref2 = this.from_items;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        i = _ref2[_j];
        fromStatement += i + ", ";
      }
      fromStatement = fromStatement.takeEndOff(", ");
    }
    /*
        The Join Statement
        */
    joinStatement = "";
    if (this.join_items.length > 0) {
      _ref3 = this.join_items;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        i = _ref3[_k];
        joinStatement += i[2] + " JOIN " + i[0] + " ON " + i[1] + " ";
      }
    }
    /*
        The Where Statement
        */
    whereStatement = "";
    if (this.where_items.length > 0) {
      whereStatement = "WHERE ";
      first = true;
      _ref4 = this.where_items;
      for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
        i = _ref4[_l];
        format_value = "";
        if (typeof i[1] === 'object' && i[1].length) {
          format_value = "(";
          _ref5 = i[1];
          for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
            x = _ref5[_m];
            format_value += "'" + this.escape(x) + "', ";
          }
          format_value = format_value.takeEndOff(", ");
          format_value += ")";
        } else {
          format_value = "'" + this.escape(i[1]) + "'";
        }
        if (first) {
          whereStatement += "(" + i[0] + " " + format_value + ") ";
          first = false;
        } else {
          whereStatement += i[2] + " (" + i[0] + " " + format_value + ") ";
        }
      }
    }
    /*
        The GroupBy Statement
        */
    groupByStatement = "";
    if (this.groupby_items.length > 0) {
      groupByStatement = "GROUP BY ";
      _ref6 = this.groupby_items;
      for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
        i = _ref6[_n];
        groupByStatement += i + ", ";
      }
      groupByStatement = groupByStatement.takeEndOff(", ");
    }
    /*
        The OrderBy Statement
        */
    orderByStatement = "";
    if (this.orderby_items.length > 0) {
      orderByStatement = "ORDER BY ";
      _ref7 = this.orderby_items;
      for (_o = 0, _len7 = _ref7.length; _o < _len7; _o++) {
        i = _ref7[_o];
        orderByStatement += i[0] + " " + i[1] + ", ";
      }
      orderByStatement = orderByStatement.takeEndOff(", ");
    }
    /*
        The Limit Statement
        */
    limitStatement = "";
    if (this.limit_num_rows != null) {
      limitStatement = "LIMIT " + this.limit_num_rows;
    }
    if ((this.limit_num_rows != null) && (this.limit_offset != null)) {
      limitStatement = "LIMIT " + this.limit_offset + ", " + this.limit_num_rows;
    }
    /*
        And lets wrap this all up
        */
    returnSql = "";
    if (selectStatement !== "") {
      returnSql += selectStatement;
    }
    if (fromStatement !== "") {
      returnSql += "\n" + fromStatement;
    }
    if (joinStatement !== "") {
      returnSql += "\n" + joinStatement;
    }
    if (whereStatement !== "") {
      returnSql += "\n" + whereStatement;
    }
    if (groupByStatement !== "") {
      returnSql += "\n" + groupByStatement;
    }
    if (orderByStatement !== "") {
      returnSql += "\n" + orderByStatement;
    }
    if (limitStatement !== "") {
      returnSql += "\n" + limitStatement;
    }
    return returnSql;
  };
  return Ciar;
})();
module.exports = Ciar;