# import the csv module
import pandas as pd
# import numpy as np

# link to the data
url="https://docs.google.com/spreadsheets/d/1o3FfjUsO-oksVLs92WX721G2GCswa2Qdu8WD3qZ6BGM/export?format=csv"

# load in the data
c = pd.read_csv(url)
print(c)

# use negative indexing to remove last two rows (average and stdev)
c = c[:-2]
print(c)

# same thing, but remove last two columns (unececary data)
c = c.iloc[:, :-3]
print(c)

# Filter out all rows with no data entered for the banana price
# Easy way to remove all rows with no data
c = c[c["Banana Price (lb)"].notnull()]
# Do it again but with potato prices, to ensure that there is no null data
c = c[c["Potato Price (lb)"].notnull()]
print(c)

def two_decimals(num):
    return f"{num:.2f}"

# round all numbers to two decimal places
for column in ["Banana Price (lb)","Strawberry Price (oz)","Apple Price (oz)","Potato Price (lb)","Onion Price (lb)","Tomato Price (lb)"]:
    c[column] = c[column].apply(two_decimals)

# Save to csv
c.to_csv("prices.csv",index=False)