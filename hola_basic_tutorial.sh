#! /bin/bash

init_globals() {
	readonly KEYSTROKE=0
	readonly EXECUTE=1
	readonly STRING=2
}

init_questions() {
	declare -Ag question1=( ["description"]="move one word backwards"
		        ["type"]="$STRING" 
		        ["ans"]=$'\eb'
		      	["section"]="bash.txt" )
	declare -Ag question2=( ["description"]="move one word forward"
		        ["type"]="$STRING" 
		        ["ans"]=$'\ef'
		      	["section"]="bash.txt" )
	declare -Ag question3=( ["description"]="delete word backwards"
		        ["type"]="$STRING" 
		        ["ans"]=$'\e\x7f'
		      	["section"]="bash.txt" )
	declare -Ag question4=( ["description"]="delete one word forward"
		        ["type"]="$STRING" 
		        ["ans"]=$'\ed'
		      	["section"]="bash.txt" )

	question5=( ["description"]="clear screen"
		        ["type"]="$STRING" 
		        ["ans"]="27"
		      	["section"]="bash.txt" )
	question6=( ["description"]="move to beginning of line"
		        ["type"]="$STRING" 
		        ["ans"]="27"
		      	["section"]="bash.txt" )
	question7=( ["description"]="move to end of line"
		        ["type"]="$STRING" 
		        ["ans"]="27"
		      	["section"]="bash.txt" )
	question8=( ["description"]="delete to beginning of line"
		        ["type"]="$STRING" 
		        ["ans"]="27"
		      	["section"]="bash.txt" )
	question9=( ["description"]="delete to end of line"
		        ["type"]="$STRING" 
		        ["ans"]="27"
		      	["section"]="bash.txt" )

}

ask_question() {
	# print question number and description
	printf "ASKING QN NO.$1\n"
	temp=question$1[description]
	printf "%s:\n" "${!temp}"
	
	read ans
	
	# print both expected and actual
	echo -n "Your answer is: "
	printf "%b" $ans | xxd -p
	temp=question$1[ans]
	echo -n "Correct answer is: "	
	printf "%b" ${!temp} | xxd -p
	
	# compare and print result
	if [ "$ans" == "${!temp}" ]; then
		echo "You are right!"
	else
		echo "YOu are WRONG!"
	fi
	printf "\n\n"
}
clear
init_globals
init_questions

ask_question 1
ask_question 2
ask_question 3
ask_question 4
