###
These "monkey patch" the string class and add a few helper methods that I take advantage of
###

String::endsWith = (str) ->
  if this.substr(this.length - str.length, str.length) == str
    return true
  else
    return false

String::takeEndOff = (str) ->
  return this.substr(0, this.length - str.length).trim()


  



###
Alright, Alright!
The good stuff, man building classes in coffee is WAAAAAY better than in plain ol javascript.
###

class Ciar
  ###
  Just a quick setup of some vars that i use throught the instance of this class
  ###
  constructor: ->
    @select_items = []
    @from_items = []
    @where_items = []
    @orderby_items = []
    @groupby_items = []
    @join_items = []

    @has_distinct = false

    @limit_num_rows = null
    @limit_offset = null



  ###
  Got this function from felixge (https://github.com/felixge/node-mysql/blob/master/lib/mysql/client.js)
  But converted it to coffee
  ###
  escape: (val) ->
    return 'NULL' if !val? or val is undefined
    switch typeof val
      when 'boolean' 
        return if val then 'true' else 'false'
      when 'number' then return val + ''
    
    return val.replace /[\0\n\r\b\t\\\'\"\x1a]/g, (s) ->
      switch s
        when "\0" then return "\\0"
        when "\n" then return "\\n"
        when "\r" then return "\\r"
        when "\b" then return "\\b"
        when "\t" then return "\\t"
        when "\x1a" then return "\\Z"
        else return "\\" + s



  select: (select) ->
    @select_items.push select
    return this

  distinct: ->
    @has_distinct = true
    return this

  from: (from) ->
    @from_items.push from 
    return this

  where: (key, value, prefix) ->
    if !prefix?
      prefix = "AND"
    if typeof key == 'object' && key.length
      for i in key
        this.where i[0], i[1], prefix
      return this

    op = "="
    key = key.trim()
    if key.endsWith " NOT IN" then [op, key] = ["NOT IN", key.takeEndOff " NOT IN"]
    else if key.endsWith " IN" then [op, key] = ["IN", key.takeEndOff " IN"]
    else if key.endsWith ">=" then [op, key] = [">=", key.takeEndOff ">="]
    else if key.endsWith "<=" then [op, key] = ["<=", key.takeEndOff "<="]
    else if key.endsWith "=" then [op, key] = ["=", key.takeEndOff "="]
    else if key.endsWith ">" then [op, key] = [">", key.takeEndOff ">"]
    else if key.endsWith "<" then [op, key] = ["<", key.takeEndOff "<"]

    @where_items.push [key + " " + op, value, prefix]
    return this

  or_where: (key, value) ->
    return this.where(key, value, "OR")
  where_in: (column, items) ->
    return this.where(column + " IN", items)
  where_not_in: (column, items) ->
    return this.where(column + " NOT IN", items)
  or_where_in: (column, items) ->
    return this.where(column + " IN", items, "OR")
  or_where_not_in: (column, items) ->
    return this.where(column + " NOT IN", items, "OR")



  order_by: (column, direction) ->
    if !direction?
      @orderby_items.push [column, "ASC"]
    else
      direction = "ASC"
      direction = "DESC" if direction.toUpperCase() == "DESC"
      @orcerby_items.push [column, direction]
    return this 


  group_by: (column) ->
    if typeof column is 'object' && column.length
      for i in column
        this.group_by i
    else
      @groupby_items.push column
    return this

  limit: (num_rows, offset) ->
    if num_rows?
      @limit_num_rows = num_rows
    if offset?
      @limit_offset = offset
    return this

  get: (table, num_rows, offset) ->
    if table?
      if num_rows?
        this.limit num_rows, offset
      return this.from table


  join: (table, comparer, join_type) ->
    if table? && comparer?
      join_type = "" if !join_type?
      @join_items.push [table, comparer, join_type]
    return this


  ###
  this is going to be a big one...  wonder if i need to break it up or put it in another class????
  ###
  sql: ->
    ###
    The select statement
    ###
    selectStatement = "SELECT "
    selectStatement += "DISTINCT " if @has_distinct

    if @select_items.length == 0
      selectStatement += "*"
    else
      for i in @select_items
        selectStatement += i + ", "
      selectStatement = selectStatement.takeEndOff ", "


    ###
    The From Statement
    ###
    fromStatement = "FROM "
    if @from_items.length > 0
      for i in @from_items
        fromStatement += i + ", "
      fromStatement = fromStatement.takeEndOff ", "



    ###
    The Join Statement
    ###
    joinStatement = ""
    if @join_items.length > 0
      for i in @join_items
        joinStatement += i[2] + " JOIN " + i[0] + " ON " + i[1] + " "


    ###
    The Where Statement
    ###
    whereStatement = ""
    if @where_items.length > 0
      whereStatement = "WHERE "
      first = true
    
      for i in @where_items
        format_value = ""

        # do we have an array? if so we need a where in
        if typeof i[1] == 'object' && i[1].length
          format_value = "("
          for x in i[1]
            format_value += "'" + this.escape(x) + "', "
          format_value = format_value.takeEndOff ", "
          format_value += ")"
        else
          format_value = "'" + this.escape(i[1]) + "'"

        if first
          whereStatement += "(" + i[0] + " " + format_value + ") "
          first = false
        else
          whereStatement += i[2] + " (" + i[0] + " " + format_value + ") "
        
    ###
    The GroupBy Statement
    ###
    groupByStatement = ""
    if @groupby_items.length > 0
      groupByStatement = "GROUP BY "
      for i in @groupby_items
        groupByStatement += i + ", "
      groupByStatement = groupByStatement.takeEndOff ", "


    ###
    The OrderBy Statement
    ###
    orderByStatement = ""
    if @orderby_items.length > 0
      orderByStatement = "ORDER BY "
      for i in @orderby_items
        orderByStatement += i[0] + " " + i[1] + ", "
      orderByStatement = orderByStatement.takeEndOff ", "

    ###
    The Limit Statement
    ###
    limitStatement = ""
    limitStatement = "LIMIT " + @limit_num_rows if @limit_num_rows?
    limitStatement = "LIMIT " + @limit_offset + ", " + @limit_num_rows if @limit_num_rows? && @limit_offset?


    ###
    And lets wrap this all up
    ###

    returnSql = ""
    returnSql += selectStatement if selectStatement != ""
    returnSql += "\n" + fromStatement if fromStatement != ""
    returnSql += "\n" + joinStatement if joinStatement != ""
    returnSql += "\n" + whereStatement if whereStatement != ""
    returnSql += "\n" + groupByStatement if groupByStatement != ""
    returnSql += "\n" + orderByStatement if orderByStatement != ""
    returnSql += "\n" + limitStatement if limitStatement != ""

    return returnSql




module.exports = Ciar
