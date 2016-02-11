#! /bin/bash

init_globals() {
	readonly KEYSTROKE=0
	readonly EXECUTE=1
	readonly STRING=2

	readonly CORRECT=0
	readonly WRONG=1
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

	declare -Ag question5=( ["description"]="clear screen"
		        ["type"]="$STRING" 
		        ["ans"]=$'\x0c'
		      	["section"]="bash.txt" )

	declare -Ag question6=( ["description"]="move to beginning of line"
		        ["type"]="$STRING" 
		        ["ans"]=$'\x01'
		      	["section"]="bash.txt" )
	declare -Ag question7=( ["description"]="move to end of line"
		        ["type"]="$STRING" 
		        ["ans"]=$'\x05'
		      	["section"]="bash.txt" )
	declare -Ag question8=( ["description"]="delete to beginning of line"
		        ["type"]="$STRING" 
		        ["ans"]=$'\x15'
		      	["section"]="bash.txt" )
	declare -Ag question9=( ["description"]="delete to end of line"
		        ["type"]="$STRING" 
		        ["ans"]=$'\x0b'
		      	["section"]="bash.txt" )

}

str_to_hex() {
	printf $(printf "%s" "$1" | xxd -p )
}

capture_ans() {
	ans=	
	while true;do
	    stty_state=$(stty -g) 
	    #Save stty to reset to default
	    stty raw isig 
	    keypress=$(dd conv=sync count=1 2>/dev/null)
	    #Capture one character at a time
	    stty "$stty_state"
	    keycode=$(printf "%s" "$keypress" | xxd -p)
	    if [ "$keycode" == "04" ] || [ "$keycode" == "0d" ]; then
		break
	    fi
	    #Revert stty back
	    ans=$ans$keycode
	done
	echo -n $ans
}

ask_question() {
	# print question number and description
	printf "ASKING QN NO.$1\n"
	temp=question$1[description]
	printf "%s:\n" "${!temp}"
	
	ans=$(capture_ans)
		
	echo -e '\b\b  '
	# print both expected and actual
	echo -ne "\nYour answer is: "
	printf "%s\n" $ans
	temp=question$1[ans]
	echo -n "Correct answer is: "	
	temp=$(printf "%b" ${!temp} | xxd -p)
	printf "%s\n" $temp
	
	# compare and print result
	if [ "$ans" == "$temp" ]; then
		print_feedback $CORRECT
	else
		print_feedback $WRONG
	fi
}

print_feedback() {
	if [ "$1" == "$CORRECT" ]; then
		tput setab 2
		echo -n "RIGHT!"
	else
		tput setab 1
		echo -n "WRONG!"
	fi
	tput setab 0
	printf "\n\n\n"
}

ask_questions_from_to() {
	for (( i=1; i <= $1; i++ ))
	do
		ask_question $i
	done

}

clear
init_globals
init_questions

ask_questions_from_to 9

