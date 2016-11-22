# Verify that all UTF-8 characters aside from the illegals here are parsed correctly by browsers.
quot = 34
newline = 10
carriageReturn = 13
backslash = 92
ampersand = 38 # just breaks in HTML
nullchar = 0 # ok for chrome, notepad++ and notepad, but breaks sublime auto detection...

skipping = [newline, quot, carriageReturn, backslash, ampersand, nullchar]

file = open("utf8-characters.html", "w")
file.write("<html><head><meta charset='UTF-8'/></head><body>")
file.write("<script>\nvar str=\"");

invalidStart = 0b11000000
invalidEnd = 0b11000010

for i in range(128):
    if (i in skipping):
        continue
    file.write(bytearray([i]))
    
for i in range(0b11111111111 + 1):
    b1 = 0b11000000 | ((i & 0b11111000000) >> 6);
    b2 = 0b10000000 | (i & 0b00000111111);
    if b1 >= invalidStart and b1 < invalidEnd: continue
    print "Writing " + bin(b1) + " " + bin(b2);
    file.write(bytearray([b1, b2]))

file.write("\";\n</script></body></html>")
file.close()
print "done"