const Status = {
    system_error:1000,
    request_params_error: 1001,
    username_exist: 4000,
    email_exist: 4001,
    username_not_exist: 4003,
    incorrect_password: 4004,
    login_expired:4005,
    incorrect_code:4006,
    invalid_extension: 4007,
    already_have_file: 4008,
    file_exist: 4009,
    file_not_exist: 4010,
    file_name_exist: 4011,
    email_not_exist: 4012,
    file_not_delete: 4013,
    hash_error: 4014,
    share_not_exist:4015,
    capacity_error:4017,
    success: 5000,
}

export default Status;