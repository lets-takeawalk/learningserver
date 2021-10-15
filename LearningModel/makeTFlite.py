import sys 
import time
def getName(name, age): 
    print (name + " : " + age) 


if __name__ == '__main__': 
    time.sleep(3)#3초 대기
    getName(sys.argv[1], sys.argv[2])