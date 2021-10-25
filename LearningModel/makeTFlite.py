import sys
import time
import datetime

def getName(name, age): 
    print (name + " : " + age) 

def mkf(name, t1, t2):
    f = open("./LearningModel/tflite_result/"+name+".tflite",'w')
    f.write(t1)
    f.write(t2)
    f.close()

if __name__ == '__main__': 
    time.sleep(3)#3초 대기
    t1 = sys.argv[1]
    t2 = sys.argv[2]
    getName(t1, t2)
    mkf(datetime.datetime.now().strftime('%Y%m%d_%H%M%S'),t1, t2)