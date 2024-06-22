use bcrypt::{verify, hash, DEFAULT_COST}; // Ensure bcrypt functions are imported
use cynic::http::SurfExt;
use cynic::QueryBuilder;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use mysql::{prelude::*, TxOpts};
use mysql::{PooledConn, params};
use mysql::Pool;
use tauri::State;
use async_std::task;
use rand::Rng;

#[cynic::schema("sr-exam")]
mod schema {}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query")]
pub struct UsersQuery {
    pub get_all_user: Vec<User>,
}

#[derive(cynic::QueryFragment, Debug, Serialize)]
#[cynic(graphql_type = "User")]
pub struct User {
    #[cynic(rename = "bn_number")]
    pub bn_number: cynic::Id,
    pub nim: String,
    pub name: String,
    pub major: String,
    pub role: String,
    pub initial: Option<String>,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query")]
pub struct AllSubjectsQuery {
    pub get_all_subject: Vec<Subject>,
}

#[derive(cynic::QueryFragment, Debug, Serialize)]
pub struct Subject {
    #[cynic(rename = "subject_name")]
    pub subject_name: String,
    #[cynic(rename = "subject_code")]
    pub subject_code: String,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query")]
pub struct AllRoomsQuery {
    pub get_all_room: Vec<Room>,
}

#[derive(cynic::QueryFragment, Debug, Serialize)]
pub struct Room {
    pub campus: String,
    #[cynic(rename = "room_capacity")]
    pub room_capacity: i32,
    #[cynic(rename = "room_number")]
    pub room_number: String,
}

#[derive(cynic::QueryFragment, Debug, Serialize)]
#[cynic(graphql_type = "Query")]
pub struct AllEnrollmentQuery {
    pub get_all_enrollment: Option<Vec<Option<Enrollment>>>,
}

#[derive(cynic::QueryFragment, Debug, Serialize)]
pub struct Enrollment {
    #[cynic(rename = "class_code")]
    pub class_code: String,
    pub nim: String,
    #[cynic(rename = "subject_code")]
    pub subject_code: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct CurrentUser {
    bn_number: String,
    nim: String,
    name: String,
    major: String,
    role: String,
    initial: Option<String>,
    login_type: String, // Added field
}

struct AppState {
    user: Mutex<Option<CurrentUser>>,
    mysql_pool: Pool,
}

struct MySQLConfig {
    user: String,
    password: String,
    host: String,
    database: String,
}

impl MySQLConfig {
    fn new(user: String, password: String, host: String, database: String) -> Self {
        Self {
            user,
            password,
            host,
            database,
        }
    }

    fn format_url(&self) -> String {
        format!(
            "mysql://{}:{}@{}/{}",
            self.user, self.password, self.host, self.database
        )
    }
}

#[tauri::command]
fn get_current_user(state: State<'_, AppState>) -> Option<CurrentUser> {
    state.user.lock().unwrap().clone()
}

#[tauri::command]
fn logout(state: State<'_, AppState>) {
    let mut user = state.user.lock().unwrap();
    *user = None;
}

#[tauri::command]
async fn get_all_users() -> Result<Vec<User>, ()> {
    let operation = UsersQuery::build({});
    let response = surf::post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
        .run_graphql(operation)
        .await;

    match response{
        Ok(response) => {
            let data = response.data.unwrap();
            Ok(data.get_all_user)
        }
        Err(_err) => Err(()),
    }
}

#[tauri::command]
async fn get_all_subject() -> Result<Vec<Subject>, ()> {
    let operation = AllSubjectsQuery::build(());
    let response = surf::post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
    .run_graphql(operation)
    .await
    .unwrap();
    return Ok(response.data.unwrap().get_all_subject);
}

#[tauri::command]
async fn get_all_room() -> Result<Vec<Room>, ()> {
    let operation = AllRoomsQuery::build(());
    let response = surf::post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
    .run_graphql(operation)
    .await
    .unwrap();
    return Ok(response.data.unwrap().get_all_room);
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct ScheduledRoom {
    room_number: String,
    shift_code: String,
}

#[tauri::command]
async fn get_scheduled_rooms(state: State<'_, AppState>, selected_date: String) -> Result<Vec<ScheduledRoom>, String> {
    println!("Selected Date: {}", selected_date);
    let mut conn = state.mysql_pool.get_conn().map_err(|e| format!("Failed to get connection: {}", e))?;

    let query = format!("SELECT room_number, shift_code FROM transaction_header WHERE date = '{}'", selected_date);
    println!("SQL Query: {}", query); // Add debug print for SQL query
    
    let schedules = conn.query_map(
        query,
        |(room_number, shift_code)| ScheduledRoom { room_number, shift_code }
    ).map_err(|e| format!("Failed to query scheduled rooms: {}", e))?;

    println!("Scheduled Rooms: {:?}", schedules); // Add debug print for fetched scheduled rooms

    Ok(schedules)
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Shift {
    shift_code: String,
    start_time: String,
    end_time: String,
}

#[tauri::command]
async fn get_all_shifts(state: State<'_, AppState>) -> Result<Vec<Shift>, String> {
    let mut conn = state.mysql_pool.get_conn().map_err(|e| format!("Failed to get connection: {}", e))?;

    let query = "SELECT shift_code, start_time, end_time FROM shifts";
    
    let shifts = conn.query_map(
        query,
        |(shift_code, start_time, end_time)| Shift { shift_code, start_time, end_time }
    ).map_err(|e| format!("Failed to query shifts: {}", e))?;

    Ok(shifts)
}

#[tauri::command]
async fn get_all_enrollment() -> Result<Vec<Enrollment>, ()> {
    let operation = AllEnrollmentQuery::build(());
    let response = surf::post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
        .run_graphql(operation)
        .await;

    match response {
        Ok(response) => {
            let data = response.data.unwrap();
            match data.get_all_enrollment {
                Some(enrollments) => Ok(enrollments.into_iter().filter_map(|e| e).collect()),
                None => Ok(vec![]),
            }
        }
        Err(_err) => Err(()),
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct ViewTransaction {
    transaction_code: String,
    subject_codes: String,
    shift_code: String,
    room_number: String,
    date: String,
    proctor: Option<String>,
}

#[tauri::command]
async fn view_transaction(state: State<'_, AppState>) -> Result<Vec<ViewTransaction>, String> {
    let mut conn = state.mysql_pool.get_conn().map_err(|e| format!("Failed to get connection: {}", e))?;

    let query = "SELECT transaction_code, subject_code, shift_code, room_number, date, proctor FROM transaction_header";
    
    let transaction_headers: Vec<ViewTransaction> = conn.query_map(
        query,
        |(transaction_code, subject_codes, shift_code, room_number, date, proctor): (String, String, String, String, String, Option<String>)| {
            ViewTransaction {
                transaction_code,
                subject_codes,
                shift_code,
                room_number,
                date,
                proctor,
            }
        },
    ).map_err(|e| format!("Failed to query transaction headers: {}", e))?;

    Ok(transaction_headers)
}

#[tauri::command]
async fn update_transaction_proctor(
    state: State<'_, AppState>,
    transaction_code: String,
    selected_assistant: String
) -> Result<String, String> {
    // Log the input parameters
    println!("Received request to update transaction proctor.");
    println!("Transaction code: {}", transaction_code);
    println!("Selected assistant: {}", selected_assistant);

    // Get a connection from the MySQL pool
    let mut conn = match state.mysql_pool.get_conn() {
        Ok(conn) => {
            println!("Successfully obtained connection from pool.");
            conn
        },
        Err(e) => {
            println!("Failed to get connection: {}", e);
            return Err(format!("Failed to get connection: {}", e));
        }
    };

    // Prepare the SQL query to update the proctor
    let query = "UPDATE transaction_header SET proctor = :selected_assistant WHERE transaction_code = :transaction_code";
    println!("SQL query prepared: {}", query);

    // Execute the SQL query
    match conn.exec_drop(query, params! {
        "selected_assistant" => selected_assistant.clone(),
        "transaction_code" => transaction_code.clone()
    }) {
        Ok(_) => {
            println!("Successfully updated proctor for transaction_code: {}", transaction_code);
            Ok("Proctor updated successfully".to_string())
        },
        Err(e) => {
            println!("Failed to update transaction: {}", e);
            Err(format!("Failed to update transaction: {}", e))
        }
    }
}

#[tauri::command]
async fn update_transaction_proctor2(
    state: State<'_, AppState>,
    transaction_code: String,
    selected_assistant: String
) -> Result<String, String> {
    // Log the input parameters
    println!("Received request to update transaction proctor.");
    println!("Transaction code: {}", transaction_code);
    println!("Selected assistant: {}", selected_assistant);

    // Get a connection from the MySQL pool
    let mut conn = match state.mysql_pool.get_conn() {
        Ok(conn) => {
            println!("Successfully obtained connection from pool.");
            conn
        },
        Err(e) => {
            println!("Failed to get connection: {}", e);
            return Err(format!("Failed to get connection: {}", e));
        }
    };

    // Prepare the SQL query to update the proctor
    let query = "UPDATE transaction_header SET proctor = :selected_assistant WHERE transaction_code = :transaction_code";
    println!("SQL query prepared: {}", query);

    // Execute the SQL query
    match conn.exec_drop(query, params! {
        "selected_assistant" => selected_assistant.clone(),
        "transaction_code" => transaction_code.clone()
    }) {
        Ok(_) => {
            println!("Successfully updated proctor for transaction_code: {}", transaction_code);
            Ok("Proctor updated successfully".to_string())
        },
        Err(e) => {
            println!("Failed to update transaction: {}", e);
            Err(format!("Failed to update transaction: {}", e))
        }
    }
}


#[derive(Serialize)]
struct AllocateExamResponse {
    transaction_code: String,
    message: String,
}

#[tauri::command]
async fn allocate_exam(
    state: State<'_, AppState>,
    subject_code: String,
    class_codes: Vec<String>,
    date: String,
    shift_code: String,
    room_number: String,
) -> Result<AllocateExamResponse, String> {
    println!("Received data:");
    println!("Subject Code: {}", subject_code);
    println!("Class Codes: {:?}", class_codes);
    println!("Date: {}", date);
    println!("Shift Code: {}", shift_code);
    println!("Room Number: {}", room_number);

    let mut conn = state.mysql_pool.get_conn().map_err(|e| format!("Failed to get connection: {}", e))?;
    
    let mut transaction = conn.start_transaction(TxOpts::default()).map_err(|e| format!("Failed to start transaction: {}", e))?;

    // Check if there is already a transaction with the same shift_code and date
    let existing_transactions: Vec<(String, String)> = transaction.exec(
        "SELECT room_number, shift_code FROM transaction_header WHERE date = ? AND shift_code = ?",
        (date.clone(), shift_code.clone()),
    ).map_err(|e| format!("Failed to query existing transactions: {}", e))?;

    if !existing_transactions.is_empty() {
        return Err(format!("A transaction with shift code {} already exists for the date {}", shift_code, date));
    }

    // Generate a transaction code: "TH" followed by 3 random digits
    let mut rng = rand::thread_rng();
    let transaction_code: String = format!("TH{:03}", rng.gen_range(0..1000));

    println!("Generated Transaction Code: {}", transaction_code);

    // Insert into transaction header
    let query = "INSERT INTO transaction_header (transaction_code, subject_code, shift_code, date, room_number) VALUES (?, ?, ?, ?, ?)";
    transaction.exec_drop(query, (transaction_code.clone(), subject_code.clone(), shift_code.clone(), date.clone(), room_number.clone())).map_err(|e| format!("Failed to insert into transaction_header: {}", e))?;
    
    transaction.commit().map_err(|e| format!("Failed to commit transaction: {}", e))?;
    
    println!("Transaction committed successfully.");
    
    Ok(AllocateExamResponse {
        transaction_code,
        message: "Exam allocated successfully".to_string(),
    })
}


#[derive(Clone, Debug, Serialize, Deserialize)]
struct EnrollmentsBySubject {
    class_code: String,
    nim: String,
    subject_code: String,
}

#[tauri::command]
async fn get_enrollments_by_subject_code(state: State<'_, AppState>, subject_code: String) -> Result<Vec<EnrollmentsBySubject>, String> {
    let mut conn = state.mysql_pool.get_conn().map_err(|e| format!("Failed to get connection: {}", e))?;

    let query = format!("SELECT class_code, nim, subject_code FROM enrollments WHERE subject_code = '{}'", subject_code);
    println!("SQL Query: {}", query); // Add debug print for SQL query
    
    let enrollments = conn.query_map(
        query,
        |(class_code, nim, subject_code)| EnrollmentsBySubject { class_code, nim, subject_code }
    ).map_err(|e| format!("Failed to query enrollments: {}", e))?;

    println!("Enrollments by Subject Code: {:?}", enrollments); // Add debug print for fetched enrollments

    Ok(enrollments)
}

fn create_users_table_if_not_exists(conn: &mut PooledConn) -> Result<(), mysql::Error> {
    conn.exec_drop(
        r"CREATE TABLE IF NOT EXISTS users (
            bn_number VARCHAR(255) NOT NULL,
            nim VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            major VARCHAR(255),
            role VARCHAR(255),
            initial VARCHAR(255),
            password VARCHAR(255)
        )", 
        ()
    )
}

fn create_rooms_table_if_not_exists(conn: &mut PooledConn) -> Result<(), mysql::Error> {
    conn.exec_drop(
        r"CREATE TABLE IF NOT EXISTS rooms (
            room_number VARCHAR(255) PRIMARY KEY,
            room_capacity INT NOT NULL,
            campus VARCHAR(255) NOT NULL
        )", 
        ()
    )
}

fn create_shifts_table_if_not_exists(conn: &mut PooledConn) -> Result<(), mysql::Error> {
    conn.exec_drop(
        r"CREATE TABLE IF NOT EXISTS shifts (
            shift_code VARCHAR(255) PRIMARY KEY,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL
        )", 
        ()
    )
}

fn create_subjects_table_if_not_exists(conn: &mut PooledConn) -> Result<(), mysql::Error> {
    conn.exec_drop(
        r"CREATE TABLE IF NOT EXISTS subjects (
            subject_code VARCHAR(255) PRIMARY KEY,
            subject_name VARCHAR(255) NOT NULL
        )", 
        ()
    )
}

fn create_transaction_header_table_if_not_exists(conn: &mut PooledConn) -> Result<(), mysql::Error> {
    conn.exec_drop(
        r"CREATE TABLE IF NOT EXISTS transaction_header (
            transaction_code VARCHAR(255) PRIMARY KEY,
            subject_code VARCHAR(255) NOT NULL,
            shift_code VARCHAR(255) NOT NULL,
            room_number VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            proctor VARCHAR(255),
            FOREIGN KEY (subject_code) REFERENCES subjects(subject_code),
            FOREIGN KEY (shift_code) REFERENCES shifts(shift_code),
            FOREIGN KEY (room_number) REFERENCES rooms(room_number)
        )", 
        ()
    )
}

fn create_enrollment_table_if_not_exists(conn: &mut PooledConn) -> Result<(), mysql::Error> {
    conn.exec_drop(
        r"CREATE TABLE IF NOT EXISTS enrollments (
            subject_code VARCHAR(255) NOT NULL,
            nim VARCHAR(255) NOT NULL,
            class_code VARCHAR(255) PRIMARY KEY,
            FOREIGN KEY (subject_code) REFERENCES subjects(subject_code),
            FOREIGN KEY (nim) REFERENCES users(nim)
        )",
        ()
    )
}

async fn insert_users(conn: &mut PooledConn) -> Result<(), ()> {
    let users = get_all_users().await.map_err(|_| ())?;

    for user in users {
        conn.exec_drop(
            r"INSERT INTO users (bn_number, name, major, initial, nim, role) 
            VALUES (:bn_number, :name, :major, :initial, :nim, :role)
            ON DUPLICATE KEY UPDATE 
                bn_number = VALUES(bn_number)", 
            params!{
                "bn_number" => user.bn_number.into_inner(),
                "initial" => user.initial.unwrap_or_default(),
                "major" => user.major,
                "name" => user.name,
                "nim" => user.nim,
                "role" => user.role,
            },
        ).expect("Failed to insert")
    }    

    Ok(())
}

#[tauri::command]
async fn insert_rooms(conn: &mut PooledConn) -> Result<(), ()> {
    let rooms = get_all_room().await?;

    for room in rooms {
        conn.exec_drop(
            r"INSERT INTO rooms (room_number, room_capacity, campus) 
            VALUES (:room_number, :room_capacity, :campus)
            ON DUPLICATE KEY UPDATE 
                room_number = VALUES(room_number)",
            params!{
                "room_number" => room.room_number,
                "room_capacity" => room.room_capacity,
                "campus" => room.campus
            },
        ).map_err(|err| {
            println!("Failed to insert room: {:?}", err);
            ()
        })?;
    }    

    Ok(())
}

#[tauri::command]
async fn insert_shifts(conn: &mut PooledConn) -> Result<(), ()> {
    let shift = vec![
        ("1", "07:00:00", "09:00:00"),
        ("2", "09:00:00", "11:00:00"),
        ("3", "11:00:00", "13:00:00"),
        ("4", "13:00:00", "15:00:00"),
        ("5", "15:00:00", "17:00:00"),
        ("6", "17:00:00", "19:00:00"),
        ("7", "19:00:00", "21:00:00"),
    ];

    for (shift_code, start_time, end_time) in shift {
        conn.exec_drop(
            r"INSERT INTO shifts (shift_code, start_time, end_time) 
            VALUES (:shift_code, :start_time, :end_time) ON DUPLICATE KEY UPDATE 
            shift_code = VALUES(shift_code)",
            params!{
                "shift_code" => shift_code,
                "start_time" => start_time,
                "end_time" => end_time,
            },
        ).expect("Failed to insert shift schedule");
    }

    Ok(())
}

#[tauri::command]
async fn insert_subjects(conn: &mut PooledConn) -> Result<(), ()> {
    let subjects = get_all_subject().await?;

    for subject in subjects {
        conn.exec_drop(
            r"INSERT INTO subjects (subject_code, subject_name) 
            VALUES (:subject_code, :subject_name)
            ON DUPLICATE KEY UPDATE 
            subject_code = VALUES(subject_code)",
            params!{
                "subject_code" => subject.subject_code,
                "subject_name" => subject.subject_name
            },
        ).map_err(|err| {
            println!("Failed to insert room: {:?}", err);
            ()
        })?;
    }    

    Ok(())
}

#[tauri::command]
async fn insert_transaction_header(conn: &mut PooledConn) -> Result<(), ()> {
    let transaction_headers = vec![
        ("TH001", "ACCT6300003", "1", "601", "2024-06-01"),
        ("TH002", "ACCT6300003", "2", "602", "2024-06-01"),
        ("TH003", "ACCT6300003", "3", "603", "2024-06-01"),
        ("TH004", "ACCT6300003", "4", "604", "2024-06-01"),
        ("TH005", "ACCT6300003", "1", "601", "2024-06-02"),
        ("TH006", "ACCT6300003", "7", "605", "2024-06-02"),
        ("TH007", "ACCT6300003", "6", "606", "2024-06-01"),
        ("TH008", "ACCT6300003", "3", "607", "2024-06-02"),
        ("TH009", "ACCT6300003", "5", "608", "2024-06-01"),
        ("TH010", "ACCT6300003", "4", "609", "2024-06-02"),
        ("TH011", "ACCT6300003", "7", "610", "2024-06-01"),
        ("TH012", "ACCT6300003", "2", "613", "2024-06-02"),
        // Add more schedules as needed
    ];

    for (transaction_code, subject_code, shift_code, room_number, date) in transaction_headers {
        conn.exec_drop(
            r"INSERT INTO transaction_header (transaction_code, subject_code, shift_code, room_number, date) 
            VALUES (:transaction_code, :subject_code, :shift_code, :room_number, :date) ON DUPLICATE KEY UPDATE 
            transaction_code = VALUES(transaction_code)",
            params!{
                "transaction_code" => transaction_code,
                "subject_code" => subject_code,
                "shift_code" => shift_code,
                "room_number" => room_number,
                "date" => date,
            },
        ).expect("Failed to insert transaction header");
    }

    Ok(())  
}

#[tauri::command]
async fn insert_enrollment(conn: &mut PooledConn) -> Result<(), ()> {
    let enrollments: Vec<Enrollment> = get_all_enrollment().await?;

    for enrollment in enrollments {
        conn.exec_drop(
            r"INSERT INTO enrollments (subject_code, nim, class_code) 
            VALUES (:subject_code, :nim, :class_code)
            ON DUPLICATE KEY UPDATE 
                class_code = VALUES(class_code)",
            params!{
                "subject_code" => enrollment.subject_code,
                "nim" => enrollment.nim,
                "class_code" => enrollment.class_code
            },
        ).map_err(|err| {
            println!("Failed to insert room: {:?}", err);
            ()
        })?;
    }    

    Ok(())
}


#[tauri::command]
fn login(username: String, password: String, state: State<'_, AppState>) -> Result<Option<String>, String> {
    let mut conn: PooledConn = state.mysql_pool.get_conn().map_err(|e| format!("Failed to get connection: {}", e))?;

    // Fetch the bn_number, name, major, initial, nim, role, and password
    let result: Option<(String, String, String, Option<String>, String, String, Option<String>)> = conn.exec_first(
        "SELECT bn_number, name, major, initial, nim, role, password FROM users WHERE nim = :username OR initial = :username",
        params! {
            "username" => username.clone(),
        }
    ).map_err(|e| format!("Failed to execute query: {}", e))?;

    if let Some((bn_number, name, major, initial, nim, role, stored_password)) = result {
        // Determine the login type
        let user_type = if username.chars().all(char::is_numeric) {
            "nim"
        } else {
            "initial"
        };

        // Check if the username and password match the stored credentials
        let is_password_correct = match stored_password {
            Some(stored_hash) => match verify(&password, &stored_hash) {
                Ok(is_verified) => is_verified,
                Err(e) => {
                    println!("Failed to verify password: {}", e);
                    return Err(format!("Failed to verify password: {}", e));
                }
            },
            None => match user_type {
                "nim" => password == nim,
                "initial" => match &initial {
                    Some(init) => password == *init,
                    None => false,
                },
                _ => false,
            },
        };

        if is_password_correct {
            let user = CurrentUser { bn_number, nim, name, major, role, initial, login_type: user_type.to_string() };
            *state.user.lock().map_err(|e| format!("Failed to lock mutex: {}", e))? = Some(user);
            Ok(Some(user_type.to_string()))
        } else {
            Ok(None)
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn change_password(current_password: String, new_password: String, state: State<'_, AppState>) -> Result<String, String> {
    let user_option = state.user.lock().unwrap();
    if let Some(user) = &*user_option {
        let mut conn: PooledConn = match state.mysql_pool.get_conn() {
            Ok(conn) => conn,
            Err(e) => {
                println!("Failed to get connection: {}", e);
                return Err(format!("Failed to get connection: {}", e));
            }
        };

        // Fetch the password field, nim, and initial from the database
        let result: Option<(Option<String>, String, Option<String>)> = match conn.exec_first(
            "SELECT password, nim, initial FROM users WHERE bn_number = :bn_number",
            params! {
                "bn_number" => user.bn_number.clone(),
            }
        ) {
            Ok(result) => result,
            Err(e) => {
                println!("Failed to execute query: {}", e);
                return Err(format!("Failed to execute query: {}", e));
            }
        };

        match result {
            Some((stored_password_hash, nim, initial)) => {
                // Check if the password is correct based on the login type or the stored hash
                let is_password_correct = match stored_password_hash {
                    Some(stored_hash) => match verify(&current_password, &stored_hash) {
                        Ok(is_verified) => is_verified,
                        Err(e) => {
                            println!("Failed to verify password: {}", e);
                            return Err(format!("Failed to verify password: {}", e));
                        }
                    },
                    None => match user.login_type.as_str() {
                        "nim" => current_password == nim,
                        "initial" => initial.as_deref() == Some(&current_password),
                        _ => false,
                    },
                };

                if is_password_correct {
                    match hash(&new_password, DEFAULT_COST) {
                        Ok(new_password_hash) => {
                            if let Err(e) = conn.exec_drop(
                                "UPDATE users SET password = :password WHERE bn_number = :bn_number",
                                params! {
                                    "password" => new_password_hash,
                                    "bn_number" => user.bn_number.clone(),
                                }
                            ) {
                                println!("Failed to execute update: {}", e);
                                return Err(format!("Failed to execute update: {}", e));
                            }
                            println!("Password changed successfully for user: {}", user.bn_number);
                            Ok("Success".into())
                        },
                        Err(e) => {
                            println!("Failed to hash new password: {}", e);
                            Err(format!("Failed to hash new password: {}", e))
                        }
                    }
                } else {
                    println!("Current password is incorrect for user: {}", user.bn_number);
                    Ok("Current password is incorrect".into())
                }
            },
            None => {
                println!("User not found: {}", user.bn_number);
                Err("User not found".into())
            }
        }
    } else {
        println!("No user logged in");
        Err("No user logged in".into())
    }
}

#[tauri::command]
async fn update_user_role(state: State<'_, AppState>, bn_number: String, new_role: String) -> Result<(), String> {
    // Log the incoming request
    println!("Received request to update role for bn_number: {}, new_role: {}", bn_number, new_role);
    
    // Attempt to get a connection from the pool
    let mut conn = match state.mysql_pool.get_conn() {
        Ok(conn) => conn,
        Err(e) => {
            println!("Failed to get connection from pool: {}", e);
            return Err(format!("Failed to get connection: {}", e));
        }
    };

    // Attempt to execute the update query
    if let Err(e) = conn.exec_drop(
        "UPDATE users SET role = :role WHERE bn_number = :bn_number",
        params! {
            "role" => new_role,
            "bn_number" => bn_number,
        }
    ) {
        println!("Failed to execute update query: {}", e);
        return Err(format!("Failed to execute update: {}", e));
    }

    Ok(())
}

fn main() {
    let mysql_config = MySQLConfig::new(
        "root".to_string(),
        "".to_string(),
        "localhost".to_string(),
        "sr-exam".to_string(),
    );

    let mysql_url = mysql_config.format_url();
    let pool = Pool::new(&*mysql_url).expect("Failed to create MySQL pool");
    {
        let mut conn = pool.get_conn().expect("Failed to get MySQL connection");
        create_users_table_if_not_exists(&mut conn).expect("Failed to create users table");
        create_rooms_table_if_not_exists(&mut conn).expect("Failed to create rooms table");
        create_shifts_table_if_not_exists(&mut conn).expect("Failed to create shift table");
        create_subjects_table_if_not_exists(&mut conn).expect("Failed to create subject table");
        create_enrollment_table_if_not_exists(&mut conn).expect("Failed to create enrollment table");
        create_transaction_header_table_if_not_exists(&mut conn).expect("Failed to create transaction_header table");

        task::block_on(async {
            insert_users(&mut conn).await.expect("Failed to insert");
            insert_rooms(&mut conn).await.expect("Failed to insert");
            insert_shifts(&mut conn).await.expect("Failed to insert");
            insert_subjects(&mut conn).await.expect("Failed to insert");
            insert_enrollment(&mut conn).await.expect("Failed to insert");
            insert_transaction_header(&mut conn).await.expect("Failed to insert transaction headers");
        });
    }

    tauri::Builder::default()
        .manage(AppState {
            user: Mutex::new(None),
            mysql_pool: pool,
        })
        .invoke_handler(tauri::generate_handler![login, logout, change_password, get_current_user, get_all_users, get_all_subject, get_all_room, get_scheduled_rooms, get_all_shifts, get_all_enrollment, get_enrollments_by_subject_code, update_user_role, allocate_exam, view_transaction, update_transaction_proctor,update_exam_transaction])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}