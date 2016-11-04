a = 65
b = 66

quot = 34
newline = 10
carriageReturn = 13
backslash = 92
nullchar = 0 # ok for chrome, notepad++ and notepad, but breaks sublime auto detection...

skipping = [newline, quot, carriageReturn, backslash, nullchar]

file = open("strings2.html", "w")
file.write("<html><head><meta charset='UTF-8'/></head><body>")
file.write("<script>\nvar str=\"");

invalidStart = 0b11000000
invalidEnd = 0b11000010
cap = 3000

for i in range(0b11111111111 + 1):
    b1 = 0b11000000 | ((i & 0b11111000000) >> 6);
    b2 = 0b10000000 | (i & 0b00000111111);
    if b1 >= invalidStart and b1 < invalidEnd: continue
    print "Writing " + bin(b1) + " " + bin(b2);
    file.write(bytearray([b1, b2]))
    cap = cap - 1
    if cap <= 0: break
    

# for i in range(0b11111 + 1):
#     for j in range(0b111111 + 1):
#         file.write(bytearray([0b11000010 | i, 0b10000000 | j]));

# for i in range(128):
#     if (i in skipping):
#         continue
#     file.write(bytearray([i]))

file.write("\";\n</script></body></html>")
file.close()
print "done"