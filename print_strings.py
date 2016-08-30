a = 65
b = 66

quot = 34
newline = 10
carriageReturn = 13
backslash = 92
nullchar = 0 # ok for chrome, notepad++ and notepad, but breaks sublime auto detection...

skipping = [newline, quot, carriageReturn, backslash, nullchar]

file = open("strings.html", "w")

file.write("<script>\nvar arr=[\n");
for i in range(128):
    if (i in skipping):
        continue
    file.write("\"a")
    file.write(bytearray([i]))
    file.write("\",\n")
    #file.write(bytearray([quot, a, i, b, quot]))
file.write("];\n</script>")
file.close()
print "done"