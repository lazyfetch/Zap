const LoginCheck=async(req,res)=>{
    console.log("You are logged in!!!")
    const user=req.user
    return res.status(200)
    .json({
        success:true,
        message:"Done",
        data:{user}
    })
}

export {LoginCheck}