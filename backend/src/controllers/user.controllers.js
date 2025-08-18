const LoginCheck=async(req,res)=>{
    console.log("You are logged in!!!")

    return res.status(200).json({
        success:true,
        message:"Done"
    })
}

export {LoginCheck}