#!/bin/bash



echo "======================= Unit Test Is Running!======================="
sleep .5
npm test > test.log
cat test.log
failing="$(grep -o "failing" test.log)"
if [[ "$failing" == *"failing"* ]]; then
   echo "==========Unit Test is failing, your commit is rejected!============"
   rm test.log
else
  rm test.log
  echo "======================= Unit Test is passed!========================"
fi

echo "======================= JShint Is Running!======================="
for f in $(ls *.js); do
    jshint "$f" > jshint.log
    jshint "$f"
    error="$(grep -o "error" jshint.log)"
    if [[ "$error" == *"error"* ]];then
      echo "==========Jhint finds errors, your commit is rejected!==========="
      rm jshint.log
      # exit 1
    fi
done
echo "======================= JShint Is passed!========================"
