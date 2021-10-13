starters <- V(subgraph603)$name

for (i in 1:21) {
  assign(paste0("table", i), starters[i])
  priors <- table1
  for (k in 1:i) {
    priors <- c(priors, get(paste0("table", k)))
  }
  neigh <- neighbors(workfrance, starters[i])$name
  neigh <- neigh[!(neigh %in% priors)] 
  
  if (length(neigh) > 0) {
    assign(paste0("table", i), c(starters[i], neigh[1]))

    # complete remainder of table
    for (j in 3:10) {
      # get most distant person
      priors <- table1
      for (k in 1:i) {
        priors <- c(priors, get(paste0("table", k)))
      }
      table <- get(paste0("table", i))
      
      opts <- distances(workfrance, v = table, weights = NA) |> 
        as.data.frame()
      opts <- opts[ ,colnames(opts)[!(colnames(opts) %in% priors)]]
  
      new <- opts |> 
        colMeans() |> 
        which.max() |> 
        names()
      # if the person is not new, take them out of the graph and 
      # get another distant person
      table[j] <- new
      assign(paste0("table", i), table)
    }
  } else {
      assign(paste0("table", i), starters[i])

      # complete remainder of table
      for (j in 2:10) {
        priors <- table1
        for (k in 1:i) {
          priors <- c(priors, get(paste0("table", k)))
        }
        # get most distant person
        table <- get(paste0("table", i))
        priors <- table1
        for (k in 1:i) {
          priors <- c(priors, get(paste0("table", k)))
        }
        
        opts <- distances(workfrance, v = table, weights = NA) |> 
          as.data.frame()
        opts <- opts[ ,colnames(opts)[!(colnames(opts) %in% priors)]]
        
        new <- opts |> 
          colMeans() |> 
          which.max() |> 
          names()
        # if the person is not new, take them out of the graph and 
        # get another distant person
        table[j] <- new
        assign(paste0("table", i), table)
    }
  }
}



for (i in 1:21) {
  print(mean(distances(workfrance, v = get(paste0("table", i)), to =  get(paste0("table", i)), weights = NA)))
}

for (i in 1:21) print(length(unique(get(paste0("table", i)))))
